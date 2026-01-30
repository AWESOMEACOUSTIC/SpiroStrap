import { create } from "zustand";

import { DummySimulatorSource } from "../services/datasource/DummySimulatorSource";
import { storage } from "../services/storage/storage";

import { computeIrregularityScore } from "../domain/classifier/computeIrregularityScore";
import { getWindowSamples } from "../domain/classifier/windowing";
import {
  DEFAULT_THRESHOLDS,
  nextLabelWithSustainedLogic
} from "../domain/classifier/sustainedLogic";
import { Label } from "../domain/models/labels";

function makeSessionId() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `sess_${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(
    d.getDate()
  )}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

const LIVE_SAMPLES_MAX = 5000;
const LIVE_WINDOWS_MAX = 3600;
const LIVE_EVENTS_MAX = 200;

const WINDOW_MS = 10_000;
const STEP_MS = 1_000;

const FLUSH_MS = 2_000;
const FLUSH_SAMPLES_MAX = 250;
const FLUSH_WINDOWS_MAX = 10;
const FLUSH_EVENTS_MAX = 5;

const EVENT_END_COOLDOWN_SECONDS = 5;

let pendingSamples = [];
let pendingWindows = [];
let pendingEvents = [];
let flushInFlight = false;

async function flushPending(sessionId) {
  if (!sessionId) return;
  if (flushInFlight) return;
  if (!pendingSamples.length && !pendingWindows.length && !pendingEvents.length)
    return;

  flushInFlight = true;

  const samplesToWrite = pendingSamples;
  const windowsToWrite = pendingWindows;
  const eventsToWrite = pendingEvents;

  pendingSamples = [];
  pendingWindows = [];
  pendingEvents = [];

  try {
    await Promise.all([
      storage.addSamples(sessionId, samplesToWrite),
      storage.addWindows(sessionId, windowsToWrite),
      storage.addEvents(sessionId, eventsToWrite)
    ]);
  } catch (err) {
    pendingSamples = samplesToWrite.concat(pendingSamples);
    pendingWindows = windowsToWrite.concat(pendingWindows);
    pendingEvents = eventsToWrite.concat(pendingEvents);
    // eslint-disable-next-line no-console
    console.error("Flush failed, re-queued pending data:", err);
  } finally {
    flushInFlight = false;
  }
}

function buildEventSummary(openEvent) {
  const redSeconds = openEvent.count;
  const avgScore = openEvent.count ? openEvent.scoreSum / openEvent.count : 0;

  return {
    startTs: openEvent.startTs,
    endTs: openEvent.endTs,
    type: "IRREGULARITY_SUSTAINED",
    severity: Math.max(openEvent.maxScore, avgScore),
    maxScore: openEvent.maxScore,
    avgScore,
    redSeconds
  };
}

export const useAppStore = create((set, get) => ({
  streaming: false,
  sessionId: null,
  startedAt: null,

  samples: [],
  lastSample: null,

  windows: [],
  lastWindow: null,

  events: [],

  currentLabel: Label.GREEN,
  currentScore: 0,

  totalSamples: 0,
  totalWindows: 0,
  labelSeconds: {
    [Label.GREEN]: 0,
    [Label.YELLOW]: 0,
    [Label.RED]: 0
  },

  _streakHigh: 0,
  _streakVeryHigh: 0,

  // event state
  _openEvent: null,
  _nonRedStreak: 0,

  _source: null,
  _windowTimer: null,
  _flushTimer: null,

  async startStreaming() {
    if (get().streaming) return;

    pendingSamples = [];
    pendingWindows = [];
    pendingEvents = [];

    const sessionId = makeSessionId();
    const startedAt = Date.now();

    set({
      streaming: true,
      sessionId,
      startedAt,
      samples: [],
      lastSample: null,
      windows: [],
      lastWindow: null,
      events: [],
      currentLabel: Label.GREEN,
      currentScore: 0,
      totalSamples: 0,
      totalWindows: 0,
      labelSeconds: {
        [Label.GREEN]: 0,
        [Label.YELLOW]: 0,
        [Label.RED]: 0
      },
      _streakHigh: 0,
      _streakVeryHigh: 0,
      _openEvent: null,
      _nonRedStreak: 0
    });

    await storage.createSession({
      sessionId,
      startedAt,
      endedAt: null,
      updatedAt: startedAt,
      source: "SIMULATOR",
      sampleRateHz: 25,
      windowMs: WINDOW_MS,
      stepMs: STEP_MS,
      thresholds: DEFAULT_THRESHOLDS,
      summary: null
    });

    const source = new DummySimulatorSource({
      sampleRateHz: 25,
      baseFreqHz: 0.25,
      noise: 0.02
    });

    source.onSample = (sample) => {
      get().pushSample(sample);
    };

    source.start();

    const windowTimer = setInterval(() => {
      get().computeNextWindow();
    }, STEP_MS);

    const flushTimer = setInterval(() => {
      void flushPending(sessionId);
      void storage.updateSession(sessionId, { updatedAt: Date.now() });
    }, FLUSH_MS);

    set({ _source: source, _windowTimer: windowTimer, _flushTimer: flushTimer });
  },

  async stopStreaming() {
    const sessionId = get().sessionId;
    if (!sessionId) return;

    const source = get()._source;
    if (source) source.stop();

    if (get()._windowTimer) clearInterval(get()._windowTimer);
    if (get()._flushTimer) clearInterval(get()._flushTimer);

    // Close any open event
    const open = get()._openEvent;
    if (open) {
      const lastEnd = get().lastWindow?.tsEnd ?? Date.now();
      const closed = buildEventSummary({ ...open, endTs: lastEnd });
      pendingEvents.push(closed);

      // also keep in live list
      const prev = get().events;
      const next =
        prev.length >= LIVE_EVENTS_MAX ? prev.slice(1) : prev.slice();
      next.push(closed);
      set({ events: next, _openEvent: null, _nonRedStreak: 0 });
    }

    await flushPending(sessionId);

    const endedAt = Date.now();
    const totalSamples = get().totalSamples;
    const totalWindows = get().totalWindows;
    const labelSeconds = get().labelSeconds;

    const summary = {
      totalSamples,
      totalWindows,
      greenSeconds: labelSeconds[Label.GREEN],
      yellowSeconds: labelSeconds[Label.YELLOW],
      redSeconds: labelSeconds[Label.RED],
      eventCount: (await storage.getEvents(sessionId)).length
    };

    await storage.updateSession(sessionId, {
      endedAt,
      updatedAt: endedAt,
      summary
    });

    set({
      streaming: false,
      _source: null,
      _windowTimer: null,
      _flushTimer: null
    });
  },

  pushSample(sample) {
    pendingSamples.push(sample);
    if (pendingSamples.length >= FLUSH_SAMPLES_MAX) {
      void flushPending(get().sessionId);
    }

    const prev = get().samples;
    const next = prev.length >= LIVE_SAMPLES_MAX ? prev.slice(1) : prev.slice();
    next.push(sample);

    set({
      samples: next,
      lastSample: sample,
      totalSamples: get().totalSamples + 1
    });
  },

  computeNextWindow() {
    if (!get().streaming) return;

    const nowTs = Date.now();
    const { startTs, endTs, windowSamples } = getWindowSamples(
      get().samples,
      WINDOW_MS,
      nowTs
    );

    if (windowSamples.length < 8) return;

    const { score, confidence } = computeIrregularityScore(windowSamples);

    const res = nextLabelWithSustainedLogic(
      score,
      get()._streakHigh,
      get()._streakVeryHigh,
      DEFAULT_THRESHOLDS
    );

    const nextWindow = {
      tsStart: startTs,
      tsEnd: endTs,
      irregularityScore: score,
      confidence,
      label: res.label
    };

    pendingWindows.push(nextWindow);
    if (pendingWindows.length >= FLUSH_WINDOWS_MAX) {
      void flushPending(get().sessionId);
    }

    const prevWindows = get().windows;
    const nextWindows =
      prevWindows.length >= LIVE_WINDOWS_MAX
        ? prevWindows.slice(1)
        : prevWindows.slice();

    nextWindows.push(nextWindow);

    // Backfill RED windows
    let redStartTsForEvent = null;
    if (res.label === Label.RED && res.backfillCount > 1) {
      for (let i = 0; i < res.backfillCount; i++) {
        const idx = nextWindows.length - 1 - i;
        if (idx < 0) break;
        nextWindows[idx] = { ...nextWindows[idx], label: Label.RED };
      }

      const earliestIdx = nextWindows.length - res.backfillCount;
      if (earliestIdx >= 0) redStartTsForEvent = nextWindows[earliestIdx].tsStart;
    }

    // -------- Event segmentation logic --------
    const currentLabel = nextWindow.label;

    if (currentLabel === Label.RED) {
      const open = get()._openEvent;

      if (!open) {
        const startForEvent = redStartTsForEvent ?? nextWindow.tsStart;

        set({
          _openEvent: {
            startTs: startForEvent,
            endTs: nextWindow.tsEnd,
            maxScore: score,
            scoreSum: score,
            count: 1
          },
          _nonRedStreak: 0
        });
      } else {
        set({
          _openEvent: {
            ...open,
            endTs: nextWindow.tsEnd,
            maxScore: Math.max(open.maxScore, score),
            scoreSum: open.scoreSum + score,
            count: open.count + 1
          },
          _nonRedStreak: 0
        });
      }
    } else {
      const open = get()._openEvent;
      if (open) {
        const nextNonRed = get()._nonRedStreak + 1;

        if (nextNonRed >= EVENT_END_COOLDOWN_SECONDS) {
          const closed = buildEventSummary(open);
          pendingEvents.push(closed);
          if (pendingEvents.length >= FLUSH_EVENTS_MAX) {
            void flushPending(get().sessionId);
          }

          const prev = get().events;
          const next =
            prev.length >= LIVE_EVENTS_MAX ? prev.slice(1) : prev.slice();
          next.push(closed);

          set({ events: next, _openEvent: null, _nonRedStreak: 0 });
        } else {
          set({ _nonRedStreak: nextNonRed });
        }
      }
    }
    // ----------------------------------------

    const prevLabelSeconds = get().labelSeconds;

    set({
      windows: nextWindows,
      lastWindow: nextWindow,
      currentLabel,
      currentScore: score,
      totalWindows: get().totalWindows + 1,
      labelSeconds: {
        ...prevLabelSeconds,
        [currentLabel]: (prevLabelSeconds[currentLabel] ?? 0) + 1
      },
      _streakHigh: res.nextStreakHigh,
      _streakVeryHigh: res.nextStreakVeryHigh
    });
  }
}));
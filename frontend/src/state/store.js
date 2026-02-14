import { create } from "zustand";

import { DummySimulatorSource } from "../services/datasource/DummySimulatorSource";
import { storage } from "../services/storage/storage";

import { computeIrregularityScore } from "../domain/classifier/computeIrregularityScore";
import { getWindowSamples } from "../domain/classifier/windowing";
import { nextLabelWithSustainedLogic } from "../domain/classifier/sustainedLogic";
import { Label } from "../domain/models/labels";
import { useSettingsStore } from "./settingsStore";

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

const FLUSH_MS_DEFAULT = 2_000;
const FLUSH_SAMPLES_MAX = 250;
const FLUSH_WINDOWS_MAX = 10;
const FLUSH_EVENTS_MAX = 5;

let pendingSamples = [];
let pendingWindows = [];
let pendingEvents = [];
let flushInFlight = false;

async function flushPending(sessionId) {
  if (!sessionId) return;
  if (flushInFlight) return;
  if (!pendingSamples.length && !pendingWindows.length && !pendingEvents.length) {
    return;
  }

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

  // runtime refs
  _source: null,
  _windowTimer: null,
  _flushTimer: null,

  // teardown hardening
  _teardownBound: false,
  _onBeforeUnload: null,
  _onVisibilityChange: null,

  // settings snapshot used for this session
  _cfg: null,

  async startStreaming() {
    if (get().streaming) return;

    // Load the current config snapshot (sanitized)
    const cfg = useSettingsStore.getState().config;

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
      _nonRedStreak: 0,
      _cfg: cfg
    });

    // Derive thresholds for classifier from cfg
    const thresholds = {
      greenMax: cfg.classification.greenMax,
      // yellowMax is unused in logic; align to highScore for completeness
      yellowMax: cfg.classification.highScore,
      highScore: cfg.classification.highScore,
      veryHighScore: cfg.classification.veryHighScore,
      sustainedSeconds: cfg.classification.sustainedSeconds,
      stepSeconds: Math.max(0.25, cfg.classification.stepMs / 1000),
      fastRedSeconds: cfg.classification.fastRedSeconds
    };

    await storage.createSession({
      sessionId,
      startedAt,
      endedAt: null,
      updatedAt: startedAt,
      source: cfg.sourceMode,
      sampleRateHz: cfg.simulator.sampleRateHz, // for simulator now
      windowMs: cfg.classification.windowMs,
      stepMs: cfg.classification.stepMs,
      thresholds,
      configSnapshot: cfg,
      summary: null
    });

    const source = new DummySimulatorSource({
      sampleRateHz: cfg.simulator.sampleRateHz,
      baseFreqHz: cfg.simulator.baseFreqHz,
      noise: cfg.simulator.noise,
      testMode: cfg.simulator.testMode
    });

    source.onSample = (sample) => {
      get().pushSample(sample);
    };

    source.start();

    const windowTimer = setInterval(
      () => {
        get().computeNextWindow();
      },
      Math.max(250, cfg.classification.stepMs)
    );

    const flushEvery = FLUSH_MS_DEFAULT; // keep simple; could be config.storage later
    const flushTimer = setInterval(() => {
      void flushPending(sessionId);
      void storage.updateSession(sessionId, { updatedAt: Date.now() });
    }, flushEvery);

    set({
      _source: source,
      _windowTimer: windowTimer,
      _flushTimer: flushTimer
    });

    // Safe teardown on refresh/close
    if (!get()._teardownBound) {
      const onBeforeUnload = () => {
        try {
          const sid = get().sessionId;
          const src = get()._source;
          if (src) src.stop();
          void flushPending(sid);
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error("beforeunload teardown error:", e);
        }
      };

      const onVisibilityChange = () => {
        if (document.visibilityState === "hidden") {
          try {
            void flushPending(get().sessionId);
          } catch (e) {
            // eslint-disable-next-line no-console
            console.error("visibilitychange flush error:", e);
          }
        }
      };

      window.addEventListener("beforeunload", onBeforeUnload);
      document.addEventListener("visibilitychange", onVisibilityChange);

      set({
        _teardownBound: true,
        _onBeforeUnload: onBeforeUnload,
        _onVisibilityChange: onVisibilityChange
      });
    }
  },

  async stopStreaming() {
    const sessionId = get().sessionId;
    if (!sessionId) return;

    const source = get()._source;
    if (source) source.stop();

    if (get()._windowTimer) clearInterval(get()._windowTimer);
    if (get()._flushTimer) clearInterval(get()._flushTimer);

    const onBeforeUnload = get()._onBeforeUnload;
    const onVisibilityChange = get()._onVisibilityChange;

    if (onBeforeUnload) {
      window.removeEventListener("beforeunload", onBeforeUnload);
    }
    if (onVisibilityChange) {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    }

    set({
      _teardownBound: false,
      _onBeforeUnload: null,
      _onVisibilityChange: null
    });

    // Close any open event
    const open = get()._openEvent;
    if (open) {
      const lastEnd = get().lastWindow?.tsEnd ?? Date.now();
      const closed = buildEventSummary({ ...open, endTs: lastEnd });
      pendingEvents.push(closed);

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

    const cfg = get()._cfg;
    const windowMs = cfg.classification.windowMs;

    const nowTs = Date.now();
    const { startTs, endTs, windowSamples } = getWindowSamples(
      get().samples,
      windowMs,
      nowTs
    );

    if (windowSamples.length < 8) return;

    const { score, confidence } = computeIrregularityScore(windowSamples);

    const thresholds = {
      greenMax: cfg.classification.greenMax,
      yellowMax: cfg.classification.highScore,
      highScore: cfg.classification.highScore,
      veryHighScore: cfg.classification.veryHighScore,
      sustainedSeconds: cfg.classification.sustainedSeconds,
      stepSeconds: Math.max(0.25, cfg.classification.stepMs / 1000),
      fastRedSeconds: cfg.classification.fastRedSeconds
    };

    const res = nextLabelWithSustainedLogic(
      score,
      get()._streakHigh,
      get()._streakVeryHigh,
      thresholds
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

    // Event segmentation with configurable cooldown
    const currentLabel = nextWindow.label;
    const cooldown = Math.max(1, cfg.events.endCooldownSeconds);

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

        if (nextNonRed >= cooldown) {
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
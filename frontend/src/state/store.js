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

const LIVE_SAMPLES_MAX = 5000; // UI buffer only
const LIVE_WINDOWS_MAX = 3600; // UI buffer only

const WINDOW_MS = 10_000;
const STEP_MS = 1_000;

const FLUSH_MS = 2_000;
const FLUSH_SAMPLES_MAX = 250;
const FLUSH_WINDOWS_MAX = 10;

// Non-reactive pending queues (avoid re-rendering the app on every pending push)
let pendingSamples = [];
let pendingWindows = [];
let flushInFlight = false;

async function flushPending(sessionId) {
  if (!sessionId) return;
  if (flushInFlight) return;

  if (!pendingSamples.length && !pendingWindows.length) return;

  flushInFlight = true;

  const samplesToWrite = pendingSamples;
  const windowsToWrite = pendingWindows;
  pendingSamples = [];
  pendingWindows = [];

  try {
    await Promise.all([
      storage.addSamples(sessionId, samplesToWrite),
      storage.addWindows(sessionId, windowsToWrite)
    ]);
  } catch (err) {
    // Re-queue on failure so we don't lose data
    pendingSamples = samplesToWrite.concat(pendingSamples);
    pendingWindows = windowsToWrite.concat(pendingWindows);
    // eslint-disable-next-line no-console
    console.error("Flush failed, re-queued pending data:", err);
  } finally {
    flushInFlight = false;
  }
}

export const useAppStore = create((set, get) => ({
  streaming: false,
  sessionId: null,
  startedAt: null,

  // Live UI buffers
  samples: [],
  lastSample: null,
  windows: [],
  lastWindow: null,

  // Live derived
  currentLabel: Label.GREEN,
  currentScore: 0,

  // Summary counters (stored into session on stop)
  totalSamples: 0,
  totalWindows: 0,
  labelSeconds: {
    [Label.GREEN]: 0,
    [Label.YELLOW]: 0,
    [Label.RED]: 0
  },

  // Sustained logic streak counters
  _streakHigh: 0,
  _streakVeryHigh: 0,

  // Runtime refs
  _source: null,
  _windowTimer: null,
  _flushTimer: null,

  async startStreaming() {
    if (get().streaming) return;

    // Reset pending queues
    pendingSamples = [];
    pendingWindows = [];

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
      _streakVeryHigh: 0
    });

    // Create session record in IndexedDB
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

    set({
      _source: source,
      _windowTimer: windowTimer,
      _flushTimer: flushTimer
    });
  },

  async stopStreaming() {
    const sessionId = get().sessionId;
    if (!sessionId) return;

    const source = get()._source;
    if (source) source.stop();

    const windowTimer = get()._windowTimer;
    if (windowTimer) clearInterval(windowTimer);

    const flushTimer = get()._flushTimer;
    if (flushTimer) clearInterval(flushTimer);

    // Final flush
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
      redSeconds: labelSeconds[Label.RED]
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
    // Add to DB queue
    pendingSamples.push(sample);
    if (pendingSamples.length >= FLUSH_SAMPLES_MAX) {
      void flushPending(get().sessionId);
    }

    // Add to UI rolling buffer
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

    // Queue for DB
    pendingWindows.push(nextWindow);
    if (pendingWindows.length >= FLUSH_WINDOWS_MAX) {
      void flushPending(get().sessionId);
    }

    // Add to UI rolling buffer
    const prevWindows = get().windows;
    const nextWindows =
      prevWindows.length >= LIVE_WINDOWS_MAX
        ? prevWindows.slice(1)
        : prevWindows.slice();

    nextWindows.push(nextWindow);

    // Backfill for RED confirmation
    if (res.label === Label.RED && res.backfillCount > 1) {
      for (let i = 0; i < res.backfillCount; i++) {
        const idx = nextWindows.length - 1 - i;
        if (idx < 0) break;
        nextWindows[idx] = { ...nextWindows[idx], label: Label.RED };
      }
    }

    const currentLabel = nextWindow.label;
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
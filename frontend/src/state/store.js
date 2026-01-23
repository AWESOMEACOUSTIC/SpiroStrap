import { create } from "zustand";

import { DummySimulatorSource } from "../services/datasource/DummySimulatorSource";
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

const LIVE_SAMPLES_MAX = 5000; // raw samples (rolling)
const LIVE_WINDOWS_MAX = 3600; // 1 window/sec => ~1 hour rolling

const WINDOW_MS = 10_000; // 10s
const STEP_MS = 1_000; // 1s

export const useAppStore = create((set, get) => ({
  streaming: false,
  sessionId: null,
  startedAt: null,

  // Live buffers
  samples: [],
  lastSample: null,

  windows: [],
  lastWindow: null,
  currentLabel: Label.GREEN,
  currentScore: 0,

  // Sustained logic streak counters
  _streakHigh: 0,
  _streakVeryHigh: 0,

  // Runtime references
  _source: null,
  _windowTimer: null,

  startStreaming() {
    if (get().streaming) return;

    const sessionId = makeSessionId();
    const startedAt = Date.now();

    // Reset state first
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
      _streakHigh: 0,
      _streakVeryHigh: 0
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

    const timer = setInterval(() => {
      get().computeNextWindow();
    }, STEP_MS);

    set({ _source: source, _windowTimer: timer });
  },

  stopStreaming() {
    const source = get()._source;
    if (source) source.stop();

    const timer = get()._windowTimer;
    if (timer) clearInterval(timer);

    set({
      streaming: false,
      _source: null,
      _windowTimer: null
    });
  },

  pushSample(sample) {
    const prev = get().samples;
    const next = prev.length >= LIVE_SAMPLES_MAX ? prev.slice(1) : prev.slice();

    next.push(sample);

    set({
      samples: next,
      lastSample: sample
    });
  },

  computeNextWindow() {
    const { streaming, samples } = get();
    if (!streaming) return;

    const nowTs = Date.now();
    const { startTs, endTs, windowSamples } = getWindowSamples(
      samples,
      WINDOW_MS,
      nowTs
    );

    if (windowSamples.length < 8) return;

    const { score, confidence } = computeIrregularityScore(windowSamples);

    const streakHigh = get()._streakHigh;
    const streakVeryHigh = get()._streakVeryHigh;

    const res = nextLabelWithSustainedLogic(
      score,
      streakHigh,
      streakVeryHigh,
      DEFAULT_THRESHOLDS
    );

    const nextWindow = {
      tsStart: startTs,
      tsEnd: endTs,
      irregularityScore: score,
      confidence,
      label: res.label
    };

    // Push window with rolling max
    const prevWindows = get().windows;
    const nextWindows =
      prevWindows.length >= LIVE_WINDOWS_MAX
        ? prevWindows.slice(1)
        : prevWindows.slice();

    nextWindows.push(nextWindow);

    // Backfill previous windows as RED if just crossed sustained threshold
    if (res.label === Label.RED && res.backfillCount > 1) {
      for (let i = 0; i < res.backfillCount; i++) {
        const idx = nextWindows.length - 1 - i;
        if (idx < 0) break;
        nextWindows[idx] = { ...nextWindows[idx], label: Label.RED };
      }
    }

    set({
      windows: nextWindows,
      lastWindow: nextWindow,
      currentLabel: nextWindow.label,
      currentScore: nextWindow.irregularityScore,
      _streakHigh: res.nextStreakHigh,
      _streakVeryHigh: res.nextStreakVeryHigh
    });
  }
}));
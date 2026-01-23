import { create } from "zustand";
import { DummySimulatorSource } from "../services/datasource/DummySimulatorSource";

function makeSessionId() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `sess_${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(
    d.getDate()
  )}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

const LIVE_BUFFER_MAX = 5000;

export const useAppStore = create((set, get) => ({
  // Session / streaming state
  streaming: false,
  sessionId: null,
  startedAt: null,

  // Live buffer
  samples: [],
  lastSample: null,

  // Private runtime reference (not persisted)
  _source: null,

  startStreaming() {
    const { streaming } = get();
    if (streaming) return;

    const sessionId = makeSessionId();
    const startedAt = Date.now();

    const source = new DummySimulatorSource({
      sampleRateHz: 25,
      baseFreqHz: 0.25,
      noise: 0.02
    });

    source.onSample = (sample) => {
      get().pushSample(sample);
    };

    source.start();

    set({
      streaming: true,
      sessionId,
      startedAt,
      samples: [],
      lastSample: null,
      _source: source
    });
  },

  stopStreaming() {
    const source = get()._source;
    if (source) source.stop();

    set({
      streaming: false,
      _source: null
    });
  },

  pushSample(sample) {
    const prev = get().samples;
    const next = prev.length >= LIVE_BUFFER_MAX ? prev.slice(1) : prev.slice();

    next.push(sample);

    set({
      samples: next,
      lastSample: sample
    });
  }
}));
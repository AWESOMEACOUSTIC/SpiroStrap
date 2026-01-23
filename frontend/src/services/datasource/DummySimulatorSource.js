function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

export class DummySimulatorSource {
  constructor(opts = {}) {
    this.sampleRateHz = opts.sampleRateHz ?? 25;
    this.baseFreqHz = opts.baseFreqHz ?? 0.25; // ~15 BPM
    this.noise = opts.noise ?? 0.02;

    this.onSample = null;

    this._running = false;
    this._timer = null;

    this._t0 = 0;
    this._irregularUntil = 0;
  }

  start() {
    if (this._running) return;
    this._running = true;

    this._t0 = Date.now();
    const periodMs = Math.max(10, Math.floor(1000 / this.sampleRateHz));

    this._timer = setInterval(() => {
      const ts = Date.now();
      const t = (ts - this._t0) / 1000;

      // Occasionally enter an irregular segment.
      if (Math.random() < 0.002) {
        const durationMs = 2500 + Math.random() * 14000; // 2.5s - 16.5s
        this._irregularUntil = ts + durationMs;
      }

      const irregular = ts < this._irregularUntil;

      const freq = irregular
        ? this.baseFreqHz * (0.6 + Math.random() * 1.7)
        : this.baseFreqHz;

      const amp = irregular ? 0.7 + Math.random() * 0.7 : 1.0;

      const value =
        amp * Math.sin(2 * Math.PI * freq * t) +
        (Math.random() * 2 - 1) * this.noise;

      const qualityBase = irregular ? 0.92 : 0.98;
      const qualityDrop = irregular && Math.random() < 0.06 ? 0.35 : 0;
      const quality = clamp01(qualityBase - qualityDrop);

      if (typeof this.onSample === "function") {
        this.onSample({ ts, value, quality });
      }
    }, periodMs);
  }

  stop() {
    this._running = false;

    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  }
}
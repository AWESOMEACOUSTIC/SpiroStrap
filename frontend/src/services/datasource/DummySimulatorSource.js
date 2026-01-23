import { IDataSource } from "./IDataSource.js";

export class DummySimulatorSource extends IDataSource {
  constructor({ intervalMs = 1000 } = {}) {
    super();
    this.intervalMs = intervalMs;
    this.timer = null;
    this.callback = null;
  }

  async connect() {
    if (this.timer) return;
    this.timer = setInterval(() => {
      if (this.callback) {
        this.callback({
          timestamp: Date.now(),
          value: Math.random() * 100,
        });
      }
    }, this.intervalMs);
  }

  async disconnect() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  onSample(callback) {
    this.callback = callback;
  }
}

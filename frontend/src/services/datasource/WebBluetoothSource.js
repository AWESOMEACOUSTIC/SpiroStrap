export class WebBluetoothSource {
  constructor(opts = {}) {
    this.serviceUUID = opts.serviceUUID;
    this.characteristicUUID = opts.characteristicUUID;

    this.sampleRateHz = opts.sampleRateHz ?? 25;
    this.format = opts.format ?? "int16"; // "int16" | "float32"
    this.littleEndian = opts.littleEndian ?? true;

    this.onSample = null;

    this._device = null;
    this._server = null;
    this._char = null;
    this._onNotif = this._handleNotification.bind(this);
    this._running = false;
  }

  async start() {
    if (!navigator.bluetooth) {
      throw new Error("Web Bluetooth not supported in this browser/context.");
    }
    if (!this.serviceUUID || !this.characteristicUUID) {
      throw new Error("BLE service and characteristic UUIDs are required.");
    }
    if (this._running) return;

    // Request user to pick a device that advertises the service.
    this._device = await navigator.bluetooth.requestDevice({
      filters: [{ services: [this.serviceUUID] }]
    });

    this._device.addEventListener("gattserverdisconnected", () => {
      // eslint-disable-next-line no-console
      console.warn("BLE device disconnected");
      this.stop(); // clean up local refs
    });

    this._server = await this._device.gatt.connect();
    const svc = await this._server.getPrimaryService(this.serviceUUID);
    this._char = await svc.getCharacteristic(this.characteristicUUID);

    await this._char.startNotifications();
    this._char.addEventListener("characteristicvaluechanged", this._onNotif);

    this._running = true;
  }

  stop() {
    this._running = false;

    try {
      if (this._char) {
        this._char.removeEventListener(
          "characteristicvaluechanged",
          this._onNotif
        );
        // Some stacks need explicit stop
        this._char.stopNotifications?.();
      }
    } catch (_) {
      // ignore
    }

    try {
      if (this._device?.gatt?.connected) {
        this._device.gatt.disconnect();
      }
    } catch (_) {
      // ignore
    }

    this._char = null;
    this._server = null;
    this._device = null;
  }

  _handleNotification(ev) {
    if (!this._running) return;
    const dv = ev.target.value;
    const len = dv.byteLength;

    // Estimate timestamps for multiple samples within the same notification.
    // We assume samples are contiguous at sampleRateHz.
    const now = Date.now();
    const periodMs = 1000 / Math.max(1, this.sampleRateHz);

    let samples = [];
    if (this.format === "int16") {
      const step = 2;
      const n = Math.floor(len / step);
      for (let i = 0; i < n; i++) {
        const raw = dv.getInt16(i * step, this.littleEndian);
        const value = Math.max(-1, Math.min(1, raw / 32768));
        samples.push(value);
      }
    } else if (this.format === "float32") {
      const step = 4;
      const n = Math.floor(len / step);
      for (let i = 0; i < n; i++) {
        const value = dv.getFloat32(i * step, this.littleEndian);
        samples.push(value);
      }
    } else {
      // Default: treat each byte as a value in [-1,1]
      for (let i = 0; i < len; i++) {
        const b = dv.getUint8(i);
        samples.push((b - 128) / 128);
      }
    }

    // Emit with ascending timestamps ending at 'now'
    const total = samples.length;
    const startTs = now - periodMs * Math.max(0, total - 1);

    for (let i = 0; i < total; i++) {
      const ts = Math.round(startTs + i * periodMs);
      const value = samples[i];
      const quality = 0.98; // Placeholder; tune with real device metadata

      if (typeof this.onSample === "function") {
        this.onSample({ ts, value, quality });
      }
    }
  }
}
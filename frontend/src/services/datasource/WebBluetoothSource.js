function clamp(x, min, max) {
  return Math.max(min, Math.min(max, x));
}

function toFiniteNumber(input) {
  const n = Number.parseFloat(String(input).trim());
  return Number.isFinite(n) ? n : null;
}

export class WebBluetoothSource {
  constructor(opts = {}) {
    this.serviceUUID = opts.serviceUUID;
    this.characteristicUUID = opts.characteristicUUID;

    this.sampleRateHz = opts.sampleRateHz ?? 25;
    this.format = opts.format ?? "csv";
    this.littleEndian = opts.littleEndian ?? true;
    this.valueScale = opts.valueScale ?? 512;

    this.onSample = null;

    this._device = null;
    this._server = null;
    this._char = null;
    this._onNotif = this._handleNotification.bind(this);
    this._onDisconnected = this._handleDisconnected.bind(this);

    this._textDecoder = new TextDecoder("utf-8");
    this._textBuffer = "";

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

    this._device.addEventListener("gattserverdisconnected", this._onDisconnected);

    try {
      if (!this._device.gatt) {
        throw new Error("Selected BLE device does not expose GATT.");
      }

      this._server = await this._device.gatt.connect();
      const svc = await this._server.getPrimaryService(this.serviceUUID);
      this._char = await svc.getCharacteristic(this.characteristicUUID);

      await this._char.startNotifications();
      this._char.addEventListener("characteristicvaluechanged", this._onNotif);

      this._running = true;
    } catch (error) {
      this.stop();
      throw error;
    }
  }

  stop() {
    this._running = false;

    try {
      if (this._device) {
        this._device.removeEventListener(
          "gattserverdisconnected",
          this._onDisconnected
        );
      }
    } catch (_) {
      // ignore
    }

    try {
      if (this._char) {
        this._char.removeEventListener(
          "characteristicvaluechanged",
          this._onNotif
        );
        // Some stacks need explicit stop
        if (typeof this._char.stopNotifications === "function") {
          const stopPromise = this._char.stopNotifications();
          if (stopPromise && typeof stopPromise.catch === "function") {
            void stopPromise.catch(() => {});
          }
        }
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
    this._textBuffer = "";
    this._textDecoder = new TextDecoder("utf-8");
  }

  _handleDisconnected() {
    // eslint-disable-next-line no-console
    console.warn("BLE device disconnected");
    this.stop();
  }

  _decodeCsvRecords(dataView) {
    const bytes = new Uint8Array(
      dataView.buffer,
      dataView.byteOffset,
      dataView.byteLength
    );

    this._textBuffer += this._textDecoder.decode(bytes, { stream: true });

    const normalized = this._textBuffer.replace(/\r\n?/g, "\n");
    const segments = normalized.split("\n");

    const completeRecords = segments.slice(0, -1);
    let remainder = segments[segments.length - 1] ?? "";

    const candidate = remainder.replace(/\0/g, "").trim();
    const fieldCount = candidate ? candidate.split(",").length : 0;

    if (fieldCount >= 6 && !candidate.endsWith(",")) {
      completeRecords.push(candidate);
      remainder = "";
    }

    this._textBuffer = remainder;

    return completeRecords
      .map((line) => line.replace(/\0/g, "").trim())
      .filter(Boolean);
  }

  _parseCsvRecord(record) {
    const fields = record.split(",").map((part) => part.trim());
    if (fields.length < 6) return null;

    const rawSignal = toFiniteNumber(fields[0]);
    if (rawSignal == null) return null;

    const baseline = toFiniteNumber(fields[1]);
    const aux1 = toFiniteNumber(fields[2]);
    const aux2 = toFiniteNumber(fields[3]);
    const qualityRaw = toFiniteNumber(fields[4]);
    const status = fields[5] ?? "";

    const centered = baseline == null ? rawSignal : rawSignal - baseline;
    const scale = Math.max(1, Math.abs(this.valueScale));
    const value = clamp(centered / scale, -1, 1);

    const quality =
      qualityRaw == null
        ? 0.98
        : clamp(qualityRaw <= 1 ? qualityRaw : qualityRaw / 100, 0, 1);

    return {
      value,
      quality,
      payload: {
        rawSignal,
        baseline,
        aux1,
        aux2,
        qualityRaw,
        status,
        csv: record
      }
    };
  }

  _handleNotification(ev) {
    if (!this._running) return;
    const dv = ev.target.value;
    const records = this._decodeCsvRecords(dv);
    if (!records.length) return;

    const parsed = records
      .map((record) => this._parseCsvRecord(record))
      .filter(Boolean);
    if (!parsed.length) return;

    // Emit with ascending timestamps ending at 'now'
    const now = Date.now();
    const periodMs = 1000 / Math.max(1, this.sampleRateHz);
    const total = parsed.length;
    const startTs = now - periodMs * Math.max(0, total - 1);

    for (let i = 0; i < total; i++) {
      const ts = Math.round(startTs + i * periodMs);
      const sample = parsed[i];

      if (typeof this.onSample === "function") {
        this.onSample({
          ts,
          value: sample.value,
          quality: sample.quality,
          ble: sample.payload
        });
      }
    }
  }
}
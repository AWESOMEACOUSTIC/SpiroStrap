export const APP_CONFIG_VERSION = 1;

export const DEFAULT_APP_CONFIG = {
  version: APP_CONFIG_VERSION,

  sourceMode: "SIMULATOR", // or "BLE"
  simulator: {
    sampleRateHz: 25,
    baseFreqHz: 0.25,
    noise: 0.02,
    testMode: false
  },

  ble: {
    // Replace these with your device's actual UUIDs
    serviceUUID: "0000abcd-0000-1000-8000-00805f9b34fb",
    characteristicUUID: "0000cdef-0000-1000-8000-00805f9b34fb",

    // Used when notifications bundle multiple samples without per-sample ts
    sampleRateHz: 25,

    // Payload format assumptions for parsing the notification value
    // Supported: "int16" (normalized to [-1,1]), "float32"
    format: "int16",
    littleEndian: true
  },

  classification: {
    windowMs: 10_000,
    stepMs: 1_000,
    greenMax: 0.35,
    highScore: 0.65,
    veryHighScore: 0.85,
    sustainedSeconds: 8,
    fastRedSeconds: 3
  },

  events: { endCooldownSeconds: 5 },

  visualization: {
    liveRangeSeconds: 120,
    historyDefaultRangeSeconds: 180,
    downsampleMaxPoints: 900
  },

  export: { defaultFormat: "JSON", includeSamplesInJson: true },

  storage: { retentionEnabled: false, keepLastSessions: 50 }
};
export const APP_CONFIG_VERSION = 1;

export const DEFAULT_APP_CONFIG = {
  version: APP_CONFIG_VERSION,

  sourceMode: "SIMULATOR", // later: "BLE"
  simulator: {
    sampleRateHz: 25,
    baseFreqHz: 0.25,
    noise: 0.02,
    testMode: false
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

  events: {
    endCooldownSeconds: 5
  },

  visualization: {
    liveRangeSeconds: 120,
    historyDefaultRangeSeconds: 180,
    downsampleMaxPoints: 900
  },

  export: {
    defaultFormat: "JSON", // JSON | CSV
    includeSamplesInJson: true
  },

  storage: {
    // Will implement actual retention in a later step if needed
    retentionEnabled: false,
    keepLastSessions: 50
  }
};
import { create } from "zustand";
import { DEFAULT_APP_CONFIG } from "../lib/constants";

const STORAGE_KEY = "spirostrap_app_config_v1";

function isObject(x) {
  return x != null && typeof x === "object" && !Array.isArray(x);
}

function clampNumber(n, { min = -Infinity, max = Infinity } = {}) {
  if (!Number.isFinite(n)) return n;
  return Math.max(min, Math.min(max, n));
}

function sanitizeConfig(raw) {
  if (!isObject(raw)) return DEFAULT_APP_CONFIG;

  const cfg = structuredClone(DEFAULT_APP_CONFIG);

  // Version (simple for now)
  cfg.version =
    typeof raw.version === "number" ? raw.version : DEFAULT_APP_CONFIG.version;

  // Source
  if (raw.sourceMode === "SIMULATOR" || raw.sourceMode === "BLE") {
    cfg.sourceMode = raw.sourceMode;
  }

  // Simulator
  if (isObject(raw.simulator)) {
    const s = raw.simulator;

    if (typeof s.sampleRateHz === "number") {
      cfg.simulator.sampleRateHz = clampNumber(s.sampleRateHz, {
        min: 1,
        max: 200
      });
    }
    if (typeof s.baseFreqHz === "number") {
      cfg.simulator.baseFreqHz = clampNumber(s.baseFreqHz, {
        min: 0.05,
        max: 2
      });
    }
    if (typeof s.noise === "number") {
      cfg.simulator.noise = clampNumber(s.noise, { min: 0, max: 1 });
    }
    if (typeof s.testMode === "boolean") {
      cfg.simulator.testMode = s.testMode;
    }
  }

  // Classification
  if (isObject(raw.classification)) {
    const c = raw.classification;

    if (typeof c.windowMs === "number") {
      cfg.classification.windowMs = clampNumber(c.windowMs, {
        min: 2000,
        max: 60_000
      });
    }
    if (typeof c.stepMs === "number") {
      cfg.classification.stepMs = clampNumber(c.stepMs, {
        min: 250,
        max: 10_000
      });
    }

    if (typeof c.greenMax === "number") {
      cfg.classification.greenMax = clampNumber(c.greenMax, {
        min: 0,
        max: 1
      });
    }
    if (typeof c.highScore === "number") {
      cfg.classification.highScore = clampNumber(c.highScore, {
        min: 0,
        max: 1
      });
    }
    if (typeof c.veryHighScore === "number") {
      cfg.classification.veryHighScore = clampNumber(c.veryHighScore, {
        min: 0,
        max: 1
      });
    }

    if (typeof c.sustainedSeconds === "number") {
      cfg.classification.sustainedSeconds = clampNumber(c.sustainedSeconds, {
        min: 1,
        max: 60
      });
    }
    if (typeof c.fastRedSeconds === "number") {
      cfg.classification.fastRedSeconds = clampNumber(c.fastRedSeconds, {
        min: 1,
        max: 30
      });
    }
  }

  // Events
  if (isObject(raw.events)) {
    const e = raw.events;
    if (typeof e.endCooldownSeconds === "number") {
      cfg.events.endCooldownSeconds = clampNumber(e.endCooldownSeconds, {
        min: 1,
        max: 60
      });
    }
  }

  // Visualization
  if (isObject(raw.visualization)) {
    const v = raw.visualization;

    if (typeof v.liveRangeSeconds === "number") {
      cfg.visualization.liveRangeSeconds = clampNumber(v.liveRangeSeconds, {
        min: 30,
        max: 600
      });
    }
    if (typeof v.historyDefaultRangeSeconds === "number") {
      cfg.visualization.historyDefaultRangeSeconds = clampNumber(
        v.historyDefaultRangeSeconds,
        { min: 30, max: 3600 }
      );
    }
    if (typeof v.downsampleMaxPoints === "number") {
      cfg.visualization.downsampleMaxPoints = clampNumber(v.downsampleMaxPoints, {
        min: 200,
        max: 5000
      });
    }
  }

  // Export
  if (isObject(raw.export)) {
    const ex = raw.export;

    if (ex.defaultFormat === "JSON" || ex.defaultFormat === "CSV") {
      cfg.export.defaultFormat = ex.defaultFormat;
    }
    if (typeof ex.includeSamplesInJson === "boolean") {
      cfg.export.includeSamplesInJson = ex.includeSamplesInJson;
    }
  }

  // Storage
  if (isObject(raw.storage)) {
    const st = raw.storage;
    if (typeof st.retentionEnabled === "boolean") {
      cfg.storage.retentionEnabled = st.retentionEnabled;
    }
    if (typeof st.keepLastSessions === "number") {
      cfg.storage.keepLastSessions = clampNumber(st.keepLastSessions, {
        min: 1,
        max: 500
      });
    }
  }

  return cfg;
}

function loadConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_APP_CONFIG;
    return sanitizeConfig(JSON.parse(raw));
  } catch {
    return DEFAULT_APP_CONFIG;
  }
}

function saveConfig(cfg) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
}

export const useSettingsStore = create((set, get) => ({
  config: loadConfig(),
  lastSavedAt: null,

  setConfig(patch) {
    const next = {
      ...get().config,
      ...patch
    };

    const sanitized = sanitizeConfig(next);
    saveConfig(sanitized);

    set({
      config: sanitized,
      lastSavedAt: Date.now()
    });
  },

  updatePath(path, value) {
    // path like: "classification.greenMax"
    const parts = String(path).split(".");
    const base = structuredClone(get().config);

    let cur = base;
    for (let i = 0; i < parts.length - 1; i++) {
      cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = value;

    const sanitized = sanitizeConfig(base);
    saveConfig(sanitized);

    set({
      config: sanitized,
      lastSavedAt: Date.now()
    });
  },

  resetConfig() {
    saveConfig(DEFAULT_APP_CONFIG);
    set({ config: DEFAULT_APP_CONFIG, lastSavedAt: Date.now() });
  }
}));
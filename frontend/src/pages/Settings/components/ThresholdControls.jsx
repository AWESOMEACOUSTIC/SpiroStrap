import { useMemo } from "react";
import { useSettingsStore } from "../../../state/settingsStore";

function NumberField({ label, value, onChange, step = 0.01, min, max }) {
  return (
    <label className="block">
      <div className="text-xs text-slate-400">{label}</div>
      <input
        className="mt-2 w-full rounded-md border border-slate-800/70 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

export default function ThresholdControls() {
  const config = useSettingsStore((s) => s.config);
  const updatePath = useSettingsStore((s) => s.updatePath);

  const c = config.classification;

  const note = useMemo(() => {
    return "Tip: change thresholds, then start a new session to apply them.";
  }, []);

  return (
    <div className="rounded-lg border border-slate-800/70 bg-slate-900/30 p-4">
      <div className="text-sm font-semibold">Classification</div>
      <div className="mt-1 text-xs text-slate-400">{note}</div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <NumberField
          label="Green max (below = GREEN)"
          value={c.greenMax}
          min={0}
          max={1}
          step={0.01}
          onChange={(v) =>
            updatePath("classification.greenMax", Number.parseFloat(v))
          }
        />

        <NumberField
          label="High score (above = candidate RED)"
          value={c.highScore}
          min={0}
          max={1}
          step={0.01}
          onChange={(v) =>
            updatePath("classification.highScore", Number.parseFloat(v))
          }
        />

        <NumberField
          label="Very high score (fast RED)"
          value={c.veryHighScore}
          min={0}
          max={1}
          step={0.01}
          onChange={(v) =>
            updatePath("classification.veryHighScore", Number.parseFloat(v))
          }
        />

        <NumberField
          label="Sustained seconds (to mark RED)"
          value={c.sustainedSeconds}
          min={1}
          max={60}
          step={1}
          onChange={(v) =>
            updatePath("classification.sustainedSeconds", Number.parseFloat(v))
          }
        />

        <NumberField
          label="Fast RED seconds (very high)"
          value={c.fastRedSeconds}
          min={1}
          max={30}
          step={1}
          onChange={(v) =>
            updatePath("classification.fastRedSeconds", Number.parseFloat(v))
          }
        />

        <NumberField
          label="Window size (ms)"
          value={c.windowMs}
          min={2000}
          max={60000}
          step={500}
          onChange={(v) =>
            updatePath("classification.windowMs", Number.parseFloat(v))
          }
        />
      </div>
    </div>
  );
}

/* 
Provides UI for users to adjust classification thresholds (green/yellow/red) 
that determine how breathing irregularity is labeled, enabling sensitivity 
tuning without code changes for different breathing patterns or activities.
*/
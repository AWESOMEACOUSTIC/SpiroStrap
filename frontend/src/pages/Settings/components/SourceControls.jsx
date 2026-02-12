import { useSettingsStore } from "../../../state/settingsStore";

export default function SourceControls() {
  const config = useSettingsStore((s) => s.config);
  const updatePath = useSettingsStore((s) => s.updatePath);

  const s = config.simulator;

  return (
    <div className="rounded-lg border border-slate-800/70 bg-slate-900/30 p-4">
      <div className="text-sm font-semibold">Source</div>
      <div className="mt-1 text-xs text-slate-400">
        BLE will be enabled in Phase I. For now, this controls the simulator.
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <label className="block">
          <div className="text-xs text-slate-400">Mode</div>
          <select
            className="mt-2 w-full rounded-md border border-slate-800/70 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
            value={config.sourceMode}
            onChange={(e) => updatePath("sourceMode", e.target.value)}
          >
            <option value="SIMULATOR">Simulator</option>
            <option value="BLE" disabled>
              BLE (coming soon)
            </option>
          </select>
        </label>

        <label className="flex items-center gap-3 rounded-md border border-slate-800/70 bg-slate-950/40 px-3 py-2">
          <input
            type="checkbox"
            checked={s.testMode}
            onChange={(e) => updatePath("simulator.testMode", e.target.checked)}
          />
          <div>
            <div className="text-sm text-slate-200">Test mode</div>
            <div className="text-xs text-slate-400">
              More irregular segments for demos
            </div>
          </div>
        </label>

        <label className="block">
          <div className="text-xs text-slate-400">Sample rate (Hz)</div>
          <input
            className="mt-2 w-full rounded-md border border-slate-800/70 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
            type="number"
            value={s.sampleRateHz}
            min={1}
            max={200}
            step={1}
            onChange={(e) =>
              updatePath("simulator.sampleRateHz", Number(e.target.value))
            }
          />
        </label>
      </div>
    </div>
  );
}
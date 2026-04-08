import { useSettingsStore } from "../../../state/settingsStore";

export default function SourceControls() {
  const config = useSettingsStore((s) => s.config);
  const updatePath = useSettingsStore((s) => s.updatePath);

  const s = config.simulator;
  const b = config.ble;

  return (
    <div className="rounded-lg border border-slate-800/70 bg-slate-900/30 p-4">
      <div className="text-sm font-semibold">Source</div>
      <div className="mt-1 text-xs text-slate-400">
        Choose Simulator (demo) or BLE (real device over Web Bluetooth).
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
            <option value="BLE">BLE</option>
          </select>
        </label>

        {config.sourceMode === "SIMULATOR" ? (
          <>
            <label className="flex items-center gap-3 rounded-md border border-slate-800/70 bg-slate-950/40 px-3 py-2">
              <input
                type="checkbox"
                checked={s.testMode}
                onChange={(e) =>
                  updatePath("simulator.testMode", e.target.checked)
                }
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
          </>
        ) : (
          <>
            <label className="block md:col-span-2">
              <div className="text-xs text-slate-400">Service UUID</div>
              <input
                className="mt-2 w-full rounded-md border border-slate-800/70 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
                type="text"
                value={b.serviceUUID}
                onChange={(e) =>
                  updatePath("ble.serviceUUID", e.target.value.trim())
                }
                placeholder="e.g. 0000abcd-0000-1000-8000-00805f9b34fb"
              />
            </label>

            <label className="block md:col-span-2">
              <div className="text-xs text-slate-400">
                Streaming Characteristic UUID
              </div>
              <input
                className="mt-2 w-full rounded-md border border-slate-800/70 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
                type="text"
                value={b.characteristicUUID}
                onChange={(e) =>
                  updatePath("ble.characteristicUUID", e.target.value.trim())
                }
                placeholder="e.g. 0000cdef-0000-1000-8000-00805f9b34fb"
              />
            </label>

            <label className="block">
              <div className="text-xs text-slate-400">Sample rate (Hz)</div>
              <input
                className="mt-2 w-full rounded-md border border-slate-800/70 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
                type="number"
                value={b.sampleRateHz}
                min={1}
                max={200}
                step={1}
                onChange={(e) =>
                  updatePath("ble.sampleRateHz", Number(e.target.value))
                }
              />
            </label>

            <label className="block">
              <div className="text-xs text-slate-400">Format</div>
              <select
                className="mt-2 w-full rounded-md border border-slate-800/70 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
                value={b.format}
                onChange={(e) => updatePath("ble.format", e.target.value)}
              >
                <option value="int16">int16 (normalized)</option>
                <option value="float32">float32</option>
              </select>
            </label>
          </>
        )}
      </div>

      {config.sourceMode === "BLE" ? (
        <div className="mt-3 text-xs text-slate-400">
          Web Bluetooth requires HTTPS (or localhost). You will be prompted to
          pick a device when starting a session.
        </div>
      ) : null}
    </div>
  );
}
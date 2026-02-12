import { useSettingsStore } from "../../../state/settingsStore";

export default function DataRetentionControls() {
  const config = useSettingsStore((s) => s.config);
  const updatePath = useSettingsStore((s) => s.updatePath);

  return (
    <div className="rounded-lg border border-slate-800/70 bg-slate-900/30 p-4">
      <div className="text-sm font-semibold">Storage</div>
      <div className="mt-1 text-xs text-slate-400">
        Retention rules can be enforced in a later step. Settings are stored now.
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="flex items-center gap-3 rounded-md border border-slate-800/70 bg-slate-950/40 px-3 py-2">
          <input
            type="checkbox"
            checked={config.storage.retentionEnabled}
            onChange={(e) =>
              updatePath("storage.retentionEnabled", e.target.checked)
            }
          />
          <div>
            <div className="text-sm text-slate-200">Enable retention</div>
            <div className="text-xs text-slate-400">
              Auto-clean old sessions (later)
            </div>
          </div>
        </label>

        <label className="block">
          <div className="text-xs text-slate-400">Keep last N sessions</div>
          <input
            className="mt-2 w-full rounded-md border border-slate-800/70 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
            type="number"
            value={config.storage.keepLastSessions}
            min={1}
            max={500}
            step={1}
            onChange={(e) =>
              updatePath("storage.keepLastSessions", Number(e.target.value))
            }
          />
        </label>
      </div>
    </div>
  );
}
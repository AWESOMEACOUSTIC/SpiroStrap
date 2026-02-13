import { useMemo } from "react";

import { useSettingsStore } from "../../state/settingsStore";

import ThresholdControls from "./components/ThresholdControls";
import DataRetentionControls from "./components/DataRetentionControls";
import SourceControls from "./components/SourceControls";

function formatSaved(ts) {
  if (!ts) return "Not saved yet";
  return `Saved: ${new Date(ts).toLocaleTimeString()}`;
}

export default function Settings() {
  const lastSavedAt = useSettingsStore((s) => s.lastSavedAt);
  const resetConfig = useSettingsStore((s) => s.resetConfig);

  const subtitle = useMemo(() => {
    return "These settings persist locally and will be applied to new sessions.";
  }, []);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-800/70 bg-slate-900/30 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-semibold">Settings</div>
            <div className="mt-1 text-xs text-slate-400">{subtitle}</div>
            <div className="mt-2 text-xs text-slate-500">
              {formatSaved(lastSavedAt)}
            </div>
          </div>

          <button
            type="button"
            className="rounded-md bg-slate-800 px-3 py-2 text-xs text-slate-100 hover:bg-slate-700"
            onClick={resetConfig}
          >
            Reset to defaults
          </button>
        </div>
      </div>

      <SourceControls />
      <ThresholdControls />
      <DataRetentionControls />
    </div>
  );
}
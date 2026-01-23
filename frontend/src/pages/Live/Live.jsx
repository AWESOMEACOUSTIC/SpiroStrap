import { useMemo } from "react";

import { useAppStore } from "../../state/store";
import {
  selectCurrentLabel,
  selectCurrentScore,
  selectLastSample,
  selectSamples,
  selectSessionId,
  selectStartedAt,
  selectStreaming,
  selectWindows
} from "../../state/selectors";
import { Label, labelToColor } from "../../domain/models/labels";

import BreathWaveformChart from "../../charts/BreathWaveformChart";
import LabelMarkersTrack from "../../charts/LabelMarkersTrack";
import Legend from "../../charts/Legend";

function formatTs(ts) {
  if (!ts) return "-";
  const d = new Date(ts);
  return d.toLocaleTimeString();
}

function StatusBadge({ label }) {
  const text =
    label === Label.GREEN ? "Normal" : label === Label.YELLOW ? "Medium" : "Anomaly";

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-slate-800/70 bg-slate-950/40 px-3 py-1 text-xs">
      <span
        className="h-2.5 w-2.5 rounded-full"
        style={{ background: labelToColor(label) }}
      />
      <span className="text-slate-200">{text}</span>
      <span className="text-slate-500">({label})</span>
    </div>
  );
}

export default function Live() {
  const streaming = useAppStore(selectStreaming);
  const sessionId = useAppStore(selectSessionId);
  const startedAt = useAppStore(selectStartedAt);

  const samples = useAppStore(selectSamples);
  const last = useAppStore(selectLastSample);

  const windows = useAppStore(selectWindows);
  const currentLabel = useAppStore(selectCurrentLabel);
  const currentScore = useAppStore(selectCurrentScore);

  const qualityText = useMemo(() => {
    if (!last) return "-";
    return `${Math.round((last.quality ?? 1) * 100)}%`;
  }, [last]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-lg border border-slate-800/70 bg-slate-900/30 p-4">
          <div className="text-xs text-slate-400">Stream</div>
          <div className="mt-1 text-sm font-semibold">
            {streaming ? "Running" : "Stopped"}
          </div>
        </div>

        <div className="rounded-lg border border-slate-800/70 bg-slate-900/30 p-4">
          <div className="text-xs text-slate-400">Session ID</div>
          <div className="mt-1 truncate text-sm font-semibold">{sessionId ?? "-"}</div>
        </div>

        <div className="rounded-lg border border-slate-800/70 bg-slate-900/30 p-4">
          <div className="text-xs text-slate-400">Started</div>
          <div className="mt-1 text-sm font-semibold">{formatTs(startedAt)}</div>
        </div>

        <div className="rounded-lg border border-slate-800/70 bg-slate-900/30 p-4">
          <div className="text-xs text-slate-400">Samples (buffer)</div>
          <div className="mt-1 text-sm font-semibold">{samples.length}</div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-slate-800/70 bg-slate-900/30 p-4">
          <div className="text-xs text-slate-400">Current status</div>
          <div className="mt-2">
            <StatusBadge label={currentLabel} />
          </div>
        </div>

        <div className="rounded-lg border border-slate-800/70 bg-slate-900/30 p-4">
          <div className="text-xs text-slate-400">Irregularity score</div>
          <div className="mt-1 text-sm font-semibold">{currentScore.toFixed(3)}</div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded bg-slate-800/60">
            <div
              className="h-full"
              style={{
                width: `${Math.round(currentScore * 100)}%`,
                background: labelToColor(currentLabel)
              }}
            />
          </div>
        </div>

        <div className="rounded-lg border border-slate-800/70 bg-slate-900/30 p-4">
          <div className="text-xs text-slate-400">Signal quality</div>
          <div className="mt-1 text-sm font-semibold">{qualityText}</div>
          <div className="mt-2 text-xs text-slate-500">
            Last: {last ? formatTs(last.ts) : "-"}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-800/70 bg-slate-900/30 p-4">
        <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-semibold">Live classification</div>
            <div className="text-xs text-slate-400">
              Window: 10s • Step: 1s • RED if sustained
            </div>
          </div>
          <Legend />
        </div>

        <div className="space-y-3">
          <LabelMarkersTrack windows={windows} rangeSeconds={120} height={44} />
          <BreathWaveformChart samples={samples} height={120} />
        </div>
      </div>
    </div>
  );
}
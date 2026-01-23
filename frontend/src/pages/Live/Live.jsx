import { useMemo } from "react";

import { useAppStore } from "../../state/store";
import {
  selectLastSample,
  selectSamples,
  selectSessionMeta,
  selectStreaming
} from "../../state/selectors";

function formatTs(ts) {
  if (!ts) return "-";
  const d = new Date(ts);
  return d.toLocaleTimeString();
}

function MiniSparkline({ samples }) {
  const points = useMemo(() => {
    const slice = samples.slice(-200);
    if (slice.length < 2) return "";

    const values = slice.map((s) => s.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = Math.max(1e-6, max - min);

    const w = 600;
    const h = 120;

    return slice
      .map((s, i) => {
        const x = (i / (slice.length - 1)) * w;
        const y = h - ((s.value - min) / range) * h;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(" ");
  }, [samples]);

  return (
    <div className="overflow-hidden rounded-lg border border-slate-800/70 bg-slate-950/40">
      <svg
        viewBox="0 0 600 120"
        className="h-28 w-full"
        preserveAspectRatio="none"
      >
        <polyline
          fill="none"
          stroke="rgba(148, 163, 184, 0.9)"
          strokeWidth="2"
          points={points}
        />
      </svg>
    </div>
  );
}

export default function Live() {
  const streaming = useAppStore(selectStreaming);
  const { sessionId, startedAt } = useAppStore(selectSessionMeta);
  const samples = useAppStore(selectSamples);
  const last = useAppStore(selectLastSample);

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
          <div className="mt-1 truncate text-sm font-semibold">
            {sessionId ?? "-"}
          </div>
        </div>

        <div className="rounded-lg border border-slate-800/70 bg-slate-900/30 p-4">
          <div className="text-xs text-slate-400">Started</div>
          <div className="mt-1 text-sm font-semibold">{formatTs(startedAt)}</div>
        </div>

        <div className="rounded-lg border border-slate-800/70 bg-slate-900/30 p-4">
          <div className="text-xs text-slate-400">Samples</div>
          <div className="mt-1 text-sm font-semibold">{samples.length}</div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-slate-800/70 bg-slate-900/30 p-4">
          <div className="text-xs text-slate-400">Last value</div>
          <div className="mt-1 text-sm font-semibold">
            {last ? last.value.toFixed(4) : "-"}
          </div>
        </div>

        <div className="rounded-lg border border-slate-800/70 bg-slate-900/30 p-4">
          <div className="text-xs text-slate-400">Signal quality</div>
          <div className="mt-1 text-sm font-semibold">{qualityText}</div>
        </div>

        <div className="rounded-lg border border-slate-800/70 bg-slate-900/30 p-4">
          <div className="text-xs text-slate-400">Last timestamp</div>
          <div className="mt-1 text-sm font-semibold">
            {last ? formatTs(last.ts) : "-"}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-800/70 bg-slate-900/30 p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Live signal preview</div>
            <div className="text-xs text-slate-400">
              Mini sparkline (last ~200 samples)
            </div>
          </div>

          <div className="text-xs text-slate-400">
            Buffer: <span className="text-slate-200">5000 samples max</span>
          </div>
        </div>

        <MiniSparkline samples={samples} />
      </div>
    </div>
  );
}
function formatTime(ts) {
  return new Date(ts).toLocaleTimeString();
}

function formatDurationMs(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${mm}m ${String(ss).padStart(2, "0")}s`;
}

export default function EventList({ events }) {
  if (!events.length) {
    return <div className="text-xs text-slate-500">No anomaly events.</div>;
  }

  return (
    <div className="divide-y divide-slate-800/70 overflow-hidden rounded-lg border border-slate-800/70">
      {events
        .slice()
        .sort((a, b) => a.startTs - b.startTs)
        .map((e) => (
          <div key={`${e.startTs}_${e.endTs}`} className="bg-slate-900/30 p-3">
            <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
              <div className="text-sm font-semibold text-slate-100">
                {e.type}
              </div>
              <div className="text-xs text-slate-400">
                {formatTime(e.startTs)} → {formatTime(e.endTs)} •{" "}
                {formatDurationMs(e.endTs - e.startTs)}
              </div>
            </div>

            <div className="mt-2 grid gap-2 text-xs text-slate-300 md:grid-cols-4">
              <div>
                Severity:{" "}
                <span className="text-slate-100">
                  {(e.severity ?? 0).toFixed(3)}
                </span>
              </div>
              <div>
                Max score:{" "}
                <span className="text-slate-100">
                  {(e.maxScore ?? 0).toFixed(3)}
                </span>
              </div>
              <div>
                Avg score:{" "}
                <span className="text-slate-100">
                  {(e.avgScore ?? 0).toFixed(3)}
                </span>
              </div>
              <div>
                Red seconds:{" "}
                <span className="text-slate-100">{e.redSeconds ?? 0}</span>
              </div>
            </div>
          </div>
        ))}
    </div>
  );
}
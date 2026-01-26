import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { liveQuery } from "dexie";

import { storage } from "../../services/storage/storage";

function formatDateTime(ts) {
  if (!ts) return "-";
  return new Date(ts).toLocaleString();
}

function formatDurationMs(ms) {
  if (ms == null || ms < 0) return "-";
  const s = Math.floor(ms / 1000);
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${mm}m ${String(ss).padStart(2, "0")}s`;
}

export default function Sessions() {
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    const sub = liveQuery(() => storage.listSessions()).subscribe({
      next: (rows) => setSessions(rows),
      error: (err) => {
        // eslint-disable-next-line no-console
        console.error("Sessions liveQuery error:", err);
      }
    });

    return () => sub.unsubscribe();
  }, []);

  const rows = useMemo(() => {
    return sessions.map((s) => {
      const endedAt = s.endedAt ?? null;
      const dur = endedAt ? endedAt - s.startedAt : null;

      return {
        ...s,
        durationText: endedAt ? formatDurationMs(dur) : "Running / Incomplete"
      };
    });
  }, [sessions]);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-800/70 bg-slate-900/30 p-4">
        <div className="text-sm font-semibold">Sessions</div>
        <div className="text-xs text-slate-400">
          Stored locally in IndexedDB (Dexie)
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-800/70">
        <div className="bg-slate-950/40 px-4 py-3 text-xs text-slate-400">
          {rows.length} session(s)
        </div>

        <div className="divide-y divide-slate-800/70">
          {rows.map((s) => (
            <div
              key={s.sessionId}
              className="bg-slate-900/30 px-4 py-3"
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">
                    {s.sessionId}
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    Started: {formatDateTime(s.startedAt)} • Ended:{" "}
                    {formatDateTime(s.endedAt)}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-xs text-slate-300">
                    Duration:{" "}
                    <span className="text-slate-100">{s.durationText}</span>
                  </div>

                  <Link
                    to={`/sessions/${s.sessionId}`}
                    className="rounded-md bg-slate-800 px-3 py-2 text-xs text-slate-100 hover:bg-slate-700"
                  >
                    View
                  </Link>
                </div>
              </div>

              {s.summary ? (
                <div className="mt-2 grid gap-2 text-xs text-slate-300 md:grid-cols-4">
                  <div>
                    Samples:{" "}
                    <span className="text-slate-100">
                      {s.summary.totalSamples}
                    </span>
                  </div>
                  <div>
                    Green:{" "}
                    <span className="text-slate-100">
                      {s.summary.greenSeconds}s
                    </span>
                  </div>
                  <div>
                    Yellow:{" "}
                    <span className="text-slate-100">
                      {s.summary.yellowSeconds}s
                    </span>
                  </div>
                  <div>
                    Red:{" "}
                    <span className="text-slate-100">
                      {s.summary.redSeconds}s
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mt-2 text-xs text-slate-500">
                  Summary not available yet.
                </div>
              )}
            </div>
          ))}

          {rows.length === 0 ? (
            <div className="bg-slate-900/30 px-4 py-8 text-center text-sm text-slate-400">
              No sessions recorded yet. Go to Live and click Start.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
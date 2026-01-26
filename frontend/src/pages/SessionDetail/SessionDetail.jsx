import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { storage } from "../../services/storage/storage";

import LabelMarkersTrack from "../../charts/LabelMarkersTrack";
import BreathWaveformChart from "../../charts/BreathWaveformChart";
import Legend from "../../charts/Legend";

function formatDateTime(ts) {
  if (!ts) return "-";
  return new Date(ts).toLocaleString();
}

export default function SessionDetail() {
  const { sessionId } = useParams();

  const [session, setSession] = useState(null);
  const [windows, setWindows] = useState([]);
  const [samples, setSamples] = useState([]);

  // Display last N seconds of waveform for performance (adjust anytime)
  const rangeSeconds = 180;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const s = await storage.getSession(sessionId);
      const w = await storage.getWindows(sessionId);

      const endTs = (s?.endedAt ?? Date.now()) || Date.now();
      const fromTs = endTs - rangeSeconds * 1000;

      const smp = await storage.getSamplesRange(sessionId, fromTs, endTs);

      if (cancelled) return;

      setSession(s ?? null);
      setWindows(w ?? []);
      setSamples(smp ?? []);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const endTs = useMemo(() => {
    return session?.endedAt ?? Date.now();
  }, [session]);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-800/70 bg-slate-900/30 p-4">
        <div className="text-sm font-semibold">Session Detail</div>
        <div className="mt-1 text-xs text-slate-400">
          ID: <span className="text-slate-200">{sessionId}</span>
        </div>

        {session ? (
          <div className="mt-2 text-xs text-slate-400">
            Started: {formatDateTime(session.startedAt)} • Ended:{" "}
            {formatDateTime(session.endedAt)}
          </div>
        ) : (
          <div className="mt-2 text-xs text-slate-500">
            Loading session metadata...
          </div>
        )}

        {session?.summary ? (
          <div className="mt-3 grid gap-2 text-xs text-slate-300 md:grid-cols-4">
            <div>
              Samples:{" "}
              <span className="text-slate-100">{session.summary.totalSamples}</span>
            </div>
            <div>
              Green:{" "}
              <span className="text-slate-100">{session.summary.greenSeconds}s</span>
            </div>
            <div>
              Yellow:{" "}
              <span className="text-slate-100">{session.summary.yellowSeconds}s</span>
            </div>
            <div>
              Red:{" "}
              <span className="text-slate-100">{session.summary.redSeconds}s</span>
            </div>
          </div>
        ) : null}
      </div>

      <div className="rounded-lg border border-slate-800/70 bg-slate-900/30 p-4">
        <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-semibold">Timeline</div>
            <div className="text-xs text-slate-400">
              Marker track uses stored windows • Waveform shows last {rangeSeconds}s
            </div>
          </div>
          <Legend />
        </div>

        <div className="space-y-3">
          <LabelMarkersTrack
            windows={windows}
            rangeSeconds={rangeSeconds}
            endTs={endTs}
            height={44}
          />
          <BreathWaveformChart samples={samples} height={140} />
        </div>

        <div className="mt-3 text-xs text-slate-500">
          Loaded windows: {windows.length} • Loaded samples: {samples.length}
        </div>
      </div>
    </div>
  );
}
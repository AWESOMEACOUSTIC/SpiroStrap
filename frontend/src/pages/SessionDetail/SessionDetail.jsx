import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { storage } from "../../services/storage/storage";
import { downsampleMinMax } from "../../domain/analytics/downsampling";

import LabelMarkersTrack from "../../charts/LabelMarkersTrack";
import BreathWaveformChart from "../../charts/BreathWaveformChart";
import Legend from "../../charts/Legend";

import ExportButtons from "./components/ExportButtons";
import EventList from "./components/EventList";

function formatDateTime(ts) {
  if (!ts) return "-";
  return new Date(ts).toLocaleString();
}

const RANGE_OPTIONS = [60, 180, 600, 1800];

export default function SessionDetail() {
  const { sessionId } = useParams();

  const [session, setSession] = useState(null);
  const [windows, setWindows] = useState([]);
  const [events, setEvents] = useState([]);

  const [rangeSeconds, setRangeSeconds] = useState(180);
  const [endTs, setEndTs] = useState(Date.now());

  const [samples, setSamples] = useState([]);

  // Load session meta + windows/events once
  useEffect(() => {
    let cancelled = false;

    async function loadMeta() {
      const s = await storage.getSession(sessionId);
      const w = await storage.getWindows(sessionId);
      const e = await storage.getEvents(sessionId);

      if (cancelled) return;

      setSession(s ?? null);
      setWindows(w ?? []);
      setEvents(e ?? []);

      const initialEnd = s?.endedAt ?? Date.now();
      setEndTs(initialEnd);
    }

    void loadMeta();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  // Load samples for current view range (debounced)
  useEffect(() => {
    if (!sessionId) return;

    let cancelled = false;
    const t = setTimeout(() => {
      void (async () => {
        const fromTs = endTs - rangeSeconds * 1000;
        const raw = await storage.getSamplesRange(sessionId, fromTs, endTs);
        const ds = downsampleMinMax(raw, 900);

        if (cancelled) return;
        setSamples(ds);
      })();
    }, 150);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [sessionId, endTs, rangeSeconds]);

  const startedAt = session?.startedAt ?? 0;
  const endedAt = session?.endedAt ?? Date.now();

  const sliderMin = useMemo(() => {
    return Math.max(startedAt + rangeSeconds * 1000, startedAt);
  }, [startedAt, rangeSeconds]);

  const sliderMax = useMemo(() => {
    return Math.max(endedAt, sliderMin + 1000);
  }, [endedAt, sliderMin]);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-800/70 bg-slate-900/30 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
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
          </div>

          <ExportButtons sessionId={sessionId} />
        </div>

        {session?.summary ? (
          <div className="mt-3 grid gap-2 text-xs text-slate-300 md:grid-cols-5">
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
            <div>
              Events:{" "}
              <span className="text-slate-100">{events.length}</span>
            </div>
          </div>
        ) : null}
      </div>

      <div className="rounded-lg border border-slate-800/70 bg-slate-900/30 p-4">
        <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-semibold">Timeline</div>
            <div className="text-xs text-slate-400">
              Zoom/pan loads samples from IndexedDB • Waveform is downsampled
            </div>
          </div>
          <Legend />
        </div>

        <div className="mb-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-slate-800/70 bg-slate-950/30 p-3">
            <div className="text-xs text-slate-400">Range (zoom)</div>
            <select
              className="mt-2 w-full rounded-md border border-slate-800/70 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
              value={rangeSeconds}
              onChange={(e) => setRangeSeconds(Number(e.target.value))}
            >
              {RANGE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  Last {r}s
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-lg border border-slate-800/70 bg-slate-950/30 p-3 md:col-span-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Pan (time scrubber)</span>
              <span className="text-slate-300">
                Viewing: {formatDateTime(endTs - rangeSeconds * 1000)} →{" "}
                {formatDateTime(endTs)}
              </span>
            </div>

            <input
              className="mt-3 w-full"
              type="range"
              min={sliderMin}
              max={sliderMax}
              step={1000}
              value={Math.min(Math.max(endTs, sliderMin), sliderMax)}
              onChange={(e) => setEndTs(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="space-y-3">
          <LabelMarkersTrack
            windows={windows}
            rangeSeconds={rangeSeconds}
            endTs={endTs}
            height={44}
          />
          <BreathWaveformChart samples={samples} height={160} />
        </div>

        <div className="mt-3 text-xs text-slate-500">
          Loaded (downsampled) waveform points: {samples.length} • Windows total:{" "}
          {windows.length}
        </div>
      </div>

      <div className="rounded-lg border border-slate-800/70 bg-slate-900/30 p-4">
        <div className="mb-2 text-sm font-semibold">Anomaly Events</div>
        <div className="mb-3 text-xs text-slate-400">
          RED windows are grouped into intervals using a cooldown rule.
        </div>
        <EventList events={events} />
      </div>
    </div>
  );
}
import { useMemo } from "react";
import { useLocation } from "react-router-dom";

import { useAppStore } from "../state/store";
import { selectStreaming } from "../state/selectors";

function titleFromPath(pathname) {
  if (pathname.startsWith("/sessions/")) return "Session Detail";
  if (pathname.startsWith("/sessions")) return "Sessions";
  if (pathname.startsWith("/settings")) return "Settings";
  return "Live";
}

export default function Topbar() {
  const location = useLocation();

  const title = useMemo(() => {
    return titleFromPath(location.pathname);
  }, [location.pathname]);

  const streaming = useAppStore(selectStreaming);
  const startStreaming = useAppStore((s) => s.startStreaming);
  const stopStreaming = useAppStore((s) => s.stopStreaming);

  return (
    <header className="sticky top-0 z-10 border-b border-slate-800/70 bg-slate-950/70 backdrop-blur">
      <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-6">
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold">{title}</h1>
          <p className="truncate text-xs text-slate-400">
            Simulator streaming • Phase C
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="rounded-md bg-slate-800 px-3 py-2 text-xs text-slate-100 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            onClick={startStreaming}
            disabled={streaming}
          >
            Start
          </button>

          <button
            className="rounded-md bg-slate-900 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            onClick={stopStreaming}
            disabled={!streaming}
          >
            Stop
          </button>
        </div>
      </div>
    </header>
  );
}
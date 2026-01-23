import { Link } from "react-router-dom";

export default function Sessions() {
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-slate-800/70 bg-slate-900/30 p-4">
        <div className="text-sm text-slate-300">
          Sessions page (placeholder). Next: list sessions from storage.
        </div>
      </div>

      <div className="rounded-lg border border-slate-800/70 bg-slate-900/30 p-4">
        <div className="text-xs text-slate-400">Demo link:</div>
        <Link
          className="text-sm text-slate-100 underline decoration-slate-700 underline-offset-4 hover:text-white"
          to="/sessions/sess_dummy_001"
        >
          Open session detail
        </Link>
      </div>
    </div>
  );
}
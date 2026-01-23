import { useParams } from "react-router-dom";

export default function SessionDetail() {
  const { sessionId } = useParams();

  return (
    <div className="rounded-lg border border-slate-800/70 bg-slate-900/30 p-4">
      <div className="text-sm text-slate-300">
        Session detail (placeholder) for:{" "}
        <span className="text-slate-100">{sessionId}</span>
      </div>
    </div>
  );
}
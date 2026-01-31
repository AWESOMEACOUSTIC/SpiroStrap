import { exporters } from "../../../services/export/exporters";

export default function ExportButtons({ sessionId }) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        className="rounded-md bg-slate-800 px-3 py-2 text-xs text-slate-100 hover:bg-slate-700"
        type="button"
        onClick={() => void exporters.exportSessionJSON(sessionId)}
      >
        Export JSON
      </button>

      <button
        className="rounded-md bg-slate-900 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
        type="button"
        onClick={() => void exporters.exportSamplesCSV(sessionId)}
      >
        Export Samples CSV
      </button>
    </div>
  );
}
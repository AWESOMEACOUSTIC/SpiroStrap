import { storage } from "../storage/storage";

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function toCsvRow(fields) {
  return fields
    .map((f) => {
      const s = String(f ?? "");
      const escaped = s.replace(/"/g, '""');
      return `"${escaped}"`;
    })
    .join(",");
}

export const exporters = {
  async exportSessionJSON(sessionId) {
    const session = await storage.getSession(sessionId);
    const windows = await storage.getWindows(sessionId);
    const events = await storage.getEvents(sessionId);
    const samples = await storage.getAllSamples(sessionId);

    const payload = {
      exportedAt: Date.now(),
      session,
      windows,
      events,
      samples
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json"
    });

    downloadBlob(blob, `${sessionId}.json`);
  },

  async exportSamplesCSV(sessionId) {
    const samples = await storage.getAllSamples(sessionId);

    const header = toCsvRow(["ts", "value", "quality"]);
    const lines = samples.map((s) => toCsvRow([s.ts, s.value, s.quality]));
    const csv = [header, ...lines].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    downloadBlob(blob, `${sessionId}_samples.csv`);
  }
};
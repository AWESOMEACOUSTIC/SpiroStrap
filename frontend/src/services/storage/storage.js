import { db } from "./db";

export const storage = {
  async createSession(session) {
    await db.sessions.put(session);
  },

  async updateSession(sessionId, patch) {
    await db.sessions.update(sessionId, patch);
  },

  async listSessions() {
    return db.sessions.orderBy("startedAt").reverse().toArray();
  },

  async getSession(sessionId) {
    return db.sessions.get(sessionId);
  },

  async addSamples(sessionId, samples) {
    if (!samples.length) return;

    const rows = samples.map((s) => ({
      sessionId,
      ts: s.ts,
      value: s.value,
      quality: s.quality ?? 1
    }));

    await db.samples.bulkPut(rows);
  },

  async addWindows(sessionId, windows) {
    if (!windows.length) return;

    const rows = windows.map((w) => ({
      sessionId,
      tsStart: w.tsStart,
      tsEnd: w.tsEnd,
      irregularityScore: w.irregularityScore,
      confidence: w.confidence,
      label: w.label
    }));

    await db.windows.bulkPut(rows);
  },

  async getWindows(sessionId) {
    return db.windows.where("sessionId").equals(sessionId).toArray();
  },

  async getSamplesRange(sessionId, fromTs, toTs) {
    return db.samples
      .where("[sessionId+ts]")
      .between([sessionId, fromTs], [sessionId, toTs])
      .toArray();
  }
};
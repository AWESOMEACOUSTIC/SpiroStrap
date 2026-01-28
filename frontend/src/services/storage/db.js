import Dexie from "dexie";

export const db = new Dexie("spirostrap_db");

// v1: sessions, samples, windows
db.version(1).stores({
  sessions: "sessionId, startedAt, endedAt, updatedAt",
  samples: "[sessionId+ts], sessionId, ts",
  windows: "[sessionId+tsEnd], sessionId, tsEnd, label"
});

// v2: add events table
db.version(2).stores({
  sessions: "sessionId, startedAt, endedAt, updatedAt",
  samples: "[sessionId+ts], sessionId, ts",
  windows: "[sessionId+tsEnd], sessionId, tsEnd, label",
  events: "[sessionId+startTs], sessionId, startTs, endTs, type"
});
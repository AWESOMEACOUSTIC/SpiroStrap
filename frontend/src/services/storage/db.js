import Dexie from "dexie";

export const db = new Dexie("spirostrap_db");

db.version(1).stores({
  // Session metadata + summary
  sessions: "sessionId, startedAt, endedAt, updatedAt",

  // High volume samples
  // Compound index enables fast range queries within a session.
  samples: "[sessionId+ts], sessionId, ts",

  // Derived 1Hz window results + labels
  windows: "[sessionId+tsEnd], sessionId, tsEnd, label"
});
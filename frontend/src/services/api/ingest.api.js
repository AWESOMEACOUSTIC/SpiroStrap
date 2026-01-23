import { apiClient } from "./client.js";

export const ingestApi = {
  ingestBatch(payload) {
    return apiClient("/api/ingest", { method: "POST", body: payload });
  },
};

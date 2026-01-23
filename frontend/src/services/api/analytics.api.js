import { apiClient } from "./client.js";

export const analyticsApi = {
  getSessionStats(sessionId) {
    return apiClient(`/api/analytics/sessions/${sessionId}/stats`);
  },
  getTrends() {
    return apiClient("/api/analytics/trends");
  },
};

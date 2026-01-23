import { apiClient } from "./client.js";

export const sessionsApi = {
  list() {
    return apiClient("/api/sessions");
  },
  get(id) {
    return apiClient(`/api/sessions/${id}`);
  },
};

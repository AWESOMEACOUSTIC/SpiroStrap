export const selectStreaming = (s) => s.streaming;
export const selectSessionMeta = (s) => ({
  sessionId: s.sessionId,
  startedAt: s.startedAt
});
export const selectSamples = (s) => s.samples;
export const selectLastSample = (s) => s.lastSample;
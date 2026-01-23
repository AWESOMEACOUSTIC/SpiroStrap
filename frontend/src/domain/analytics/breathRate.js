export function estimateBreathRate(samples, durationMs) {
  if (!samples.length || !durationMs) return 0;
  return (samples.length / durationMs) * 60000;
}

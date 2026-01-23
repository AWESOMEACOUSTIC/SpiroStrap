export function computeIrregularityScore(samples) {
  if (!samples || samples.length === 0) return 0;
  const values = samples.map((s) => s.value);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / values.length;
  return Math.sqrt(variance);
}

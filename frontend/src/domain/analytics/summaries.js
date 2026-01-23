export function summarizeSession(samples = []) {
  if (!samples.length) return { count: 0, min: null, max: null, avg: null };
  const values = samples.map((s) => s.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return { count: samples.length, min, max, avg };
}

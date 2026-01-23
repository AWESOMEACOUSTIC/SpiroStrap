export function getWindowSamples(samples, windowMs, nowTs) {
  const endTs = nowTs;
  const startTs = endTs - windowMs;

  // samples is already a rolling buffer; filter is fine at this scale.
  const windowSamples = samples.filter((s) => s.ts >= startTs && s.ts <= endTs);

  return { startTs, endTs, windowSamples };
}
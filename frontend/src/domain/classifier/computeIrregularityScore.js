function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

function std(values) {
  const n = values.length;
  if (n === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const v = values.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
  return Math.sqrt(v);
}

/**
 * Returns { score, confidence, qualityAvg }.
 * - score: 0..1 (higher = more irregular)
 * - confidence: 0..1 (higher = more reliable signal)
 */
export function computeIrregularityScore(windowSamples) {
  if (!windowSamples || windowSamples.length < 8) {
    return { score: 0, confidence: 0, qualityAvg: 0 };
  }

  const values = windowSamples.map((s) => s.value);
  const diffs = [];

  let qSum = 0;
  for (let i = 0; i < windowSamples.length; i++) {
    qSum += windowSamples[i].quality ?? 1;
    if (i > 0) {
      diffs.push(Math.abs(values[i] - values[i - 1]));
    }
  }

  const qualityAvg = qSum / windowSamples.length;

  // Variability of derivative captures jitter/irregular motion well.
  const diffVar = std(diffs);
  const diffScore = diffVar / (diffVar + 0.03);

  // Amplitude instability (optional mild weight).
  const ampVar = std(values);
  const ampScore = ampVar / (ampVar + 0.2);

  // Push score up when quality is low.
  const qualityPenalty = 1 - qualityAvg;

  const score = clamp01(0.75 * diffScore + 0.15 * ampScore + 0.1 * qualityPenalty);
  const confidence = clamp01(qualityAvg);

  return { score, confidence, qualityAvg };
}
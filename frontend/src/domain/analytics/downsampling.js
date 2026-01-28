/**
 * Downsample by preserving min/max per bucket.
 * Keeps peaks and works well for waveform visualization.
 *
 * @param {Array<{ts:number,value:number,quality?:number}>} samples
 * @param {number} maxPoints - approx max number of points to return
 */
export function downsampleMinMax(samples, maxPoints = 800) {
  if (!samples || samples.length <= maxPoints) return samples;

  const targetBuckets = Math.max(1, Math.floor(maxPoints / 2));
  const bucketSize = Math.max(1, Math.floor(samples.length / targetBuckets));

  const out = [];

  for (let b = 0; b < targetBuckets; b++) {
    const start = b * bucketSize;
    const end = b === targetBuckets - 1 ? samples.length : (b + 1) * bucketSize;

    const bucket = samples.slice(start, end);
    if (!bucket.length) continue;

    let min = bucket[0];
    let max = bucket[0];

    for (const s of bucket) {
      if (s.value < min.value) min = s;
      if (s.value > max.value) max = s;
    }

    // Keep chronological order
    if (min.ts <= max.ts) {
      out.push(min, max);
    } else {
      out.push(max, min);
    }
  }

  return out;
}
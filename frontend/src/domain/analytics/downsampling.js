export function downsample(samples, factor = 2) {
  if (factor <= 1) return samples;
  return samples.filter((_, idx) => idx % factor === 0);
}

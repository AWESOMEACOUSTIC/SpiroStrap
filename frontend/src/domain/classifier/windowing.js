export function windowSamples(samples, windowSize) {
  const windows = [];
  for (let i = 0; i < samples.length; i += windowSize) {
    windows.push(samples.slice(i, i + windowSize));
  }
  return windows;
}

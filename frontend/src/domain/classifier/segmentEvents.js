export function segmentEvents(windowResults) {
  return windowResults.map((w) => ({
    timestamp: w.end,
    type: w.label,
    payload: w,
  }));
}

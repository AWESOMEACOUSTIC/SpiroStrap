export function isSustainedAbove(threshold, scores, sustainCount = 3) {
  let count = 0;
  for (const score of scores) {
    if (score > threshold) count += 1;
    else count = 0;
    if (count >= sustainCount) return true;
  }
  return false;
}

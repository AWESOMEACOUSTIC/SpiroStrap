import { Label } from "../models/labels";

export const DEFAULT_THRESHOLDS = {
  greenMax: 0.35,
  yellowMax: 0.65,

  highScore: 0.65, // candidate red
  veryHighScore: 0.85, // fast red if very high

  sustainedSeconds: 8, // >= 8s => RED
  stepSeconds: 1,

  fastRedSeconds: 3 // >= 3s at veryHighScore => RED
};

/**
 * Produces label with "few seconds vs sustained" rule using streak counters.
 * Returns:
 *  - label
 *  - nextStreakHigh
 *  - nextStreakVeryHigh
 *  - backfillCount (how many previous windows to mark RED)
 */
export function nextLabelWithSustainedLogic(score, streakHigh, streakVeryHigh, cfg) {
  const needed = Math.ceil(cfg.sustainedSeconds / cfg.stepSeconds);
  const fastNeeded = Math.ceil(cfg.fastRedSeconds / cfg.stepSeconds);

  const isHigh = score > cfg.highScore;
  const isVeryHigh = score > cfg.veryHighScore;

  const nextStreakHigh = isHigh ? streakHigh + 1 : 0;
  const nextStreakVeryHigh = isVeryHigh ? streakVeryHigh + 1 : 0;

  // Base label (note: scores above yellowMax are still YELLOW until sustained).
  let baseLabel = Label.GREEN;
  if (score >= cfg.greenMax) baseLabel = Label.YELLOW;

  let label = baseLabel;
  let backfillCount = 0;

  if (nextStreakVeryHigh >= fastNeeded) {
    label = Label.RED;
    backfillCount = fastNeeded;
  } else if (nextStreakHigh >= needed) {
    label = Label.RED;
    backfillCount = needed;
  }

  return { label, nextStreakHigh, nextStreakVeryHigh, backfillCount };
}
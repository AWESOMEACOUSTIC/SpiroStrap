import { Label } from "../models/labels";

/**
 * Segment RED windows into anomaly events.
 *
 * Rules:
 * - Start event when label becomes RED
 * - End event when label is not RED for cooldownSeconds
 *
 * @param {Array<{tsStart:number, tsEnd:number, label:string, irregularityScore:number}>} windows
 * @param {{cooldownSeconds?:number}} opts
 */
export function segmentEventsFromWindows(windows, opts = {}) {
  const cooldownSeconds = opts.cooldownSeconds ?? 5;

  const sorted = (windows ?? []).slice().sort((a, b) => a.tsEnd - b.tsEnd);

  const events = [];
  let open = null;
  let nonRedStreak = 0;

  for (const w of sorted) {
    const isRed = w.label === Label.RED;

    if (isRed) {
      nonRedStreak = 0;

      if (!open) {
        open = {
          startTs: w.tsStart,
          endTs: w.tsEnd,
          count: 1,
          scoreSum: w.irregularityScore ?? 0,
          maxScore: w.irregularityScore ?? 0
        };
      } else {
        open.endTs = w.tsEnd;
        open.count += 1;
        open.scoreSum += w.irregularityScore ?? 0;
        open.maxScore = Math.max(open.maxScore, w.irregularityScore ?? 0);
      }
      continue;
    }

    if (open) {
      nonRedStreak += 1;

      if (nonRedStreak >= cooldownSeconds) {
        const avgScore = open.count ? open.scoreSum / open.count : 0;

        events.push({
          startTs: open.startTs,
          endTs: open.endTs,
          type: "IRREGULARITY_SUSTAINED",
          severity: Math.max(open.maxScore, avgScore),
          maxScore: open.maxScore,
          avgScore,
          redSeconds: open.count
        });

        open = null;
        nonRedStreak = 0;
      }
    }
  }

  // Close open event at end if needed
  if (open) {
    const avgScore = open.count ? open.scoreSum / open.count : 0;

    events.push({
      startTs: open.startTs,
      endTs: open.endTs,
      type: "IRREGULARITY_SUSTAINED",
      severity: Math.max(open.maxScore, avgScore),
      maxScore: open.maxScore,
      avgScore,
      redSeconds: open.count
    });
  }

  return events;
}
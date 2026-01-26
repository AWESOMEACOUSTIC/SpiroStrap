import { useMemo } from "react";
import { labelToColor } from "../domain/models/labels";

export default function LabelMarkersTrack({
  windows,
  rangeSeconds = 120,
  height = 44,
  endTs
}) {
  const { dots, minTs, maxTs } = useMemo(() => {
    const maxTs = endTs ?? Date.now();
    const minTs = maxTs - rangeSeconds * 1000;

    const filtered = windows.filter((w) => w.tsEnd >= minTs && w.tsEnd <= maxTs);

    return {
      minTs,
      maxTs,
      dots: filtered
    };
  }, [windows, rangeSeconds, endTs]);

  const w = 600;
  const h = height;

  return (
    <div className="overflow-hidden rounded-lg border border-slate-800/70 bg-slate-950/40">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full"
        style={{ height }}
        preserveAspectRatio="none"
      >
        <line
          x1="0"
          y1={h / 2}
          x2={w}
          y2={h / 2}
          stroke="rgba(148, 163, 184, 0.25)"
          strokeWidth="2"
        />

        {dots.map((d) => {
          const denom = Math.max(1, maxTs - minTs);
          const x = ((d.tsEnd - minTs) / denom) * w;

          return (
            <circle
              key={`${d.sessionId ?? "sess"}_${d.tsEnd}`}
              cx={x}
              cy={h / 2}
              r="5"
              fill={labelToColor(d.label)}
              opacity="0.95"
            />
          );
        })}
      </svg>
    </div>
  );
}
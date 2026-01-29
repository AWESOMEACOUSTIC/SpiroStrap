import { useMemo } from "react";

export default function BreathWaveformChart({ samples, height = 140 }) {
  const { points } = useMemo(() => {
    if (!samples || samples.length < 2) return { points: "" };

    const w = 600;
    const h = height;

    const values = samples.map((s) => s.value);
    const minV = Math.min(...values);
    const maxV = Math.max(...values);
    const rangeV = Math.max(1e-6, maxV - minV);

    const minTs = samples[0].ts;
    const maxTs = samples[samples.length - 1].ts;
    const rangeTs = Math.max(1, maxTs - minTs);

    const points = samples
      .map((s) => {
        const x = ((s.ts - minTs) / rangeTs) * w;
        const y = h - ((s.value - minV) / rangeV) * h;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(" ");

    return { points };
  }, [samples, height]);

  return (
    <div className="overflow-hidden rounded-lg border border-slate-800/70 bg-slate-950/40">
      <svg
        viewBox={`0 0 600 ${height}`}
        className="w-full"
        style={{ height }}
        preserveAspectRatio="none"
      >
        <polyline
          fill="none"
          stroke="rgba(148, 163, 184, 0.9)"
          strokeWidth="2"
          points={points}
        />
      </svg>
    </div>
  );
}
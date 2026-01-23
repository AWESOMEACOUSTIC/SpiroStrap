import { useMemo } from "react";

export default function BreathWaveformChart({ samples, height = 120 }) {
  const points = useMemo(() => {
    const slice = samples.slice(-250);
    if (slice.length < 2) return "";

    const values = slice.map((s) => s.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = Math.max(1e-6, max - min);

    const w = 600;
    const h = height;

    return slice
      .map((s, i) => {
        const x = (i / (slice.length - 1)) * w;
        const y = h - ((s.value - min) / range) * h;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(" ");
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
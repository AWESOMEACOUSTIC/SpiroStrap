export function BreathWaveformChart({ data = [] }) {
  return (
    <div className="chart chart-waveform">
      <div className="chart-title">Breath Waveform</div>
      <div className="chart-placeholder">{data.length} samples</div>
    </div>
  );
}

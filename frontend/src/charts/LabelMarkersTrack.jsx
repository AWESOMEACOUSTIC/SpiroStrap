export function LabelMarkersTrack({ markers = [] }) {
  return (
    <div className="chart chart-markers">
      <div className="chart-title">Label Markers</div>
      <div className="chart-placeholder">{markers.length} markers</div>
    </div>
  );
}

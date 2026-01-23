export function Legend({ items = [] }) {
  return (
    <div className="chart-legend">
      {items.map((item) => (
        <div key={item.label} className="chart-legend-item">
          <span className="chart-legend-swatch" style={{ background: item.color }} />
          <span className="chart-legend-label">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

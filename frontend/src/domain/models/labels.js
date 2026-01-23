export const Label = {
  GREEN: "GREEN",
  YELLOW: "YELLOW",
  RED: "RED"
};

export function labelToColor(label) {
  switch (label) {
    case Label.GREEN:
      return "#22c55e";
    case Label.YELLOW:
      return "#eab308";
    case Label.RED:
      return "#ef4444";
    default:
      return "#94a3b8";
  }
}
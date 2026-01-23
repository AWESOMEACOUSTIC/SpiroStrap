import { Label, labelToColor } from "../domain/models/labels";

function Item({ label, text }) {
  return (
    <div className="flex items-center gap-2 text-xs text-slate-300">
      <span
        className="inline-block h-2.5 w-2.5 rounded-full"
        style={{ background: labelToColor(label) }}
      />
      <span>{text}</span>
    </div>
  );
}

export default function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Item label={Label.GREEN} text="Normal" />
      <Item label={Label.YELLOW} text="Medium complexity (few seconds irregular)" />
      <Item label={Label.RED} text="Anomaly (sustained/increasing irregularity)" />
    </div>
  );
}
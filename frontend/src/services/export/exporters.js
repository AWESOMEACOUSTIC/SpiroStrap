export function exportJson(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  return blob;
}

export function exportCsv(csvString) {
  const blob = new Blob([csvString], { type: "text/csv" });
  return blob;
}

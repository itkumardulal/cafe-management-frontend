export function formatRecordRange(page: number, limit: number, total: number): string {
  if (total === 0) {
    return "Showing 0 records";
  }
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  const noun = total === 1 ? "record" : "records";
  return `Showing ${start.toLocaleString()}–${end.toLocaleString()} of ${total.toLocaleString()} ${noun}`;
}

/** Display title for a sealed KOT batch on print / kitchen ticket UI. */
export function kotBatchDisplayTitle(batch: { batchNo: number; label: string }): string {
  if (batch.batchNo === 1) return "New Order";
  return batch.batchNo > 1 ? `${batch.label} ${batch.batchNo}` : batch.label;
}

import {
  operationsApi,
  type TableOrderKotBatch,
  type TableOrderKotView,
} from "@/src/services/operations-api";

/** Fetch KOT state, seal pending items if needed, return only the latest batch to print. */
export async function fetchLatestKotBatch(sessionId: string): Promise<{
  batch: TableOrderKotBatch | null;
  view: TableOrderKotView;
}> {
  let view = await operationsApi.tableOrders.getKot(sessionId, { force: true });

  if (view.unsealedLines.length > 0) {
    view = await operationsApi.tableOrders.sealKot(sessionId);
  }

  return { batch: view.batches.at(-1) ?? null, view };
}

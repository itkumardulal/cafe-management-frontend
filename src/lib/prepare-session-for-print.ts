import { sessionWriteQueue } from "@/src/lib/session-write-queue";
import {
  isDeletedSessionUpdate,
  operationsApi,
  type TableOrderSessionDetail,
} from "@/src/services/operations-api";

export type SessionLinePayload = {
  menuItemId: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
};

type PrepareSessionForPrintArgs = {
  session: TableOrderSessionDetail;
  lines: SessionLinePayload[];
  withVersionRetry: <T>(
    sessionId: string,
    run: (version: number) => Promise<T>,
    initialVersion: number,
  ) => Promise<T>;
};

/** Flush pending lines to the server before a read-only print (KOT or interim bill). */
export async function prepareSessionForPrint({
  session,
  lines,
  withVersionRetry,
}: PrepareSessionForPrintArgs): Promise<
  | { kind: "ready"; session: TableOrderSessionDetail }
  | { kind: "cleared"; session: TableOrderSessionDetail }
> {
  if (session.status !== "OPEN") {
    return { kind: "ready", session };
  }

  const saved = await sessionWriteQueue.enqueue(
    session.id,
    "critical",
    () =>
      withVersionRetry(
        session.id,
        (version) =>
          operationsApi.tableOrders.updateLines(session.id, {
            version,
            lines,
          }),
        session.version,
      ),
    "updateLines",
  );

  if (isDeletedSessionUpdate(saved)) {
    return { kind: "cleared", session };
  }

  return { kind: "ready", session: saved };
}

"use client";

import axios from "axios";
import { ArrowLeft, Printer } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  TableOrderKotReceipt,
  type TableOrderKotPrintData,
} from "@/src/components/table-orders/table-order-kot-receipt";
import { PageHeader } from "@/src/components/shared/page-header";
import { Button } from "@/src/components/ui/button";
import { ThermalPrintHost } from "@/src/features/printing/components/thermal-print-host";
import { useThermalPrint } from "@/src/features/printing/hooks/use-thermal-print";
import { getApiErrorMessage } from "@/src/lib/api-error";
import { formatCompactDateTime } from "@/src/features/printing/lib/thermal-text";
import { appToast } from "@/src/lib/toast";
import {
  operationsApi,
  type TableOrderKotBatch,
  type TableOrderKotView,
} from "@/src/services/operations-api";

function kotEmptyMessage(status: TableOrderKotView["status"] | null): string {
  if (status === "IN_BILLING") {
    return "Order is at billing — kitchen tickets are closed for this table.";
  }
  if (status === "CLOSED") {
    return "Table closed — no kitchen orders to print.";
  }
  return "No kitchen orders to print for this table.";
}

export default function TableOrderKotPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = typeof params.sessionId === "string" ? params.sessionId : "";

  const [loading, setLoading] = useState(true);
  const [kot, setKot] = useState<TableOrderKotView | null>(null);

  const { printDocument, isPrinting, printLoaded } =
    useThermalPrint<TableOrderKotPrintData>({
      onError: (error) =>
        appToast.error(getApiErrorMessage(error, "Failed to prepare kitchen ticket")),
    });

  const loadKot = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      let view = await operationsApi.tableOrders.getKot(sessionId, { force: true });
      if (view.printable && view.unsealedLines.length > 0) {
        view = await operationsApi.tableOrders.sealKot(sessionId);
      }
      setKot(view);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        appToast.error("Table order not found");
        router.replace("/table-orders");
        return;
      }
      appToast.error(getApiErrorMessage(error, "Failed to load kitchen orders"));
    } finally {
      setLoading(false);
    }
  }, [router, sessionId]);

  useEffect(() => {
    void loadKot();
  }, [loadKot]);

  const handlePrintBatch = (batch: TableOrderKotBatch) => {
    printLoaded(batch);
  };

  const showEmpty = !loading && kot && (!kot.printable || kot.batches.length === 0);

  return (
    <section className="page-shell page-content space-y-6 pb-10">
      <PageHeader
        title="Print kitchen order"
        description={
          kot?.tableNames.length
            ? `Table ${kot.tableNames.join(" + ")}`
            : "Kitchen tickets for this table"
        }
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => router.push("/table-orders")}
            >
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              Back to tables
            </Button>
          </div>
        }
      />

      {loading ? (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center text-sm text-[var(--color-muted)]">
          Loading kitchen orders…
        </div>
      ) : showEmpty ? (
        <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-12 text-center">
          <p className="text-sm font-medium text-[var(--color-foreground)]">
            No kitchen orders
          </p>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            {kotEmptyMessage(kot?.status ?? null)}
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mt-5"
            onClick={() => router.push("/table-orders")}
          >
            Return to table service
          </Button>
        </div>
      ) : kot ? (
        <div className="space-y-4">
          {kot.batches.map((batch) => (
            <article
              key={batch.id}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--color-border)] px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--color-foreground)]">
                    {batch.batchNo > 1 ? `${batch.label} ${batch.batchNo}` : batch.label}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                    Table {batch.tableNamesSnapshot} · {formatCompactDateTime(batch.createdAt)}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  disabled={isPrinting}
                  onClick={() => handlePrintBatch(batch)}
                >
                  <Printer className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                  Print
                </Button>
              </div>
              <ul className="divide-y divide-[var(--color-border)] px-4 py-2">
                {batch.lines.map((line, idx) => (
                  <li
                    key={`${batch.id}-${idx}`}
                    className="flex items-start justify-between gap-3 py-2.5 text-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-[var(--color-foreground)]">
                        {line.menuItemName}
                      </span>
                      {line.notes?.trim() ? (
                        <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                          {line.notes.trim()}
                        </p>
                      ) : null}
                    </div>
                    <span className="shrink-0 font-mono font-semibold tabular-nums text-[var(--color-foreground)]">
                      × {line.quantity}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="border-t border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-4">
                <div className="mx-auto max-w-xs">
                  <TableOrderKotReceipt batch={batch} />
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      <ThermalPrintHost open={printDocument != null}>
        {printDocument ? (
          <TableOrderKotReceipt batch={printDocument} id="table-order-kot-print" />
        ) : null}
      </ThermalPrintHost>
    </section>
  );
}

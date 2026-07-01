"use client";

import { ArrowLeft, Clock, Loader2, Receipt } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/src/components/shared/page-header";
import { TableOrderInterimReceipt } from "@/src/components/table-orders/table-order-interim-receipt";
import { Button } from "@/src/components/ui/button";
import { ThermalPrintHost } from "@/src/features/printing/components/thermal-print-host";
import { useTableOrderThermalPrint } from "@/src/hooks/use-table-order-thermal-print";
import { getApiErrorMessage } from "@/src/lib/api-error";
import { formatCompactDateTime } from "@/src/features/printing/lib/thermal-text";
import { formatMoney } from "@/src/lib/format-display";
import { appToast } from "@/src/lib/toast";
import {
  operationsApi,
  type TableOrderAwaitingSettlementItem,
} from "@/src/services/operations-api";
import { useTableOrdersSocket } from "@/src/hooks/use-table-orders-socket";

type WaitingSettlementViewProps = {
  backHref?: string;
};

export function WaitingSettlementView({
  backHref = "/table-orders",
}: WaitingSettlementViewProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<TableOrderAwaitingSettlementItem[]>([]);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [printingSessionId, setPrintingSessionId] = useState<string | null>(null);

  const { printDocument, isPrintBusy, printInterimBill } = useTableOrderThermalPrint({
    onError: (error) =>
      appToast.error(getApiErrorMessage(error, "Failed to print interim bill")),
  });

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await operationsApi.tableOrders.awaitingSettlement({ force: true });
      setItems(data.items);
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to load waiting bills"));
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useTableOrdersSocket({
    onBoardChanged: () => void load(true),
    onSessionChanged: () => void load(true),
  });

  const handleGenerateBill = async (item: TableOrderAwaitingSettlementItem) => {
    setGeneratingId(item.sessionId);
    try {
      await operationsApi.tableOrders.generateBill(item.sessionId);
      router.push(`/pos?sessionId=${item.sessionId}`);
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to generate bill"));
      setGeneratingId(null);
    }
  };

  const handlePrintInterimBill = async (item: TableOrderAwaitingSettlementItem) => {
    if (isPrintBusy || printingSessionId) return;
    setPrintingSessionId(item.sessionId);
    try {
      const bill = await operationsApi.tableOrders.getInterimBill(item.sessionId, {
        force: true,
      });
      printInterimBill(bill);
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to print interim bill"));
    } finally {
      setPrintingSessionId(null);
    }
  };

  return (
    <section className="page-shell page-content space-y-6 pb-10">
      <PageHeader
        title="Waiting bill settlement"
        description="Tables released for new guests while their bill is still pending. Generate the bill when the customer is ready to pay."
        action={
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => router.push(backHref)}
          >
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            Back to tables
          </Button>
        }
      />

      {loading ? (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center text-sm text-[var(--color-muted)]">
          Loading waiting bills…
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-12 text-center">
          <Receipt
            className="mx-auto h-9 w-9 text-[var(--color-muted)] opacity-50"
            strokeWidth={1.25}
            aria-hidden
          />
          <p className="mt-3 text-sm font-medium text-[var(--color-foreground)]">
            No bills waiting for settlement
          </p>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Use “Move to bill” on a table to park its bill here and free the table.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => {
            const isPrinting = printingSessionId === item.sessionId;
            const actionsDisabled =
              generatingId === item.sessionId || isPrinting || isPrintBusy;

            return (
              <article
                key={item.sessionId}
                className="flex flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-muted)]">
                      Table
                    </p>
                    <p className="truncate font-mono text-sm font-semibold text-[var(--color-foreground)]">
                      {item.tableNamesLabel || "—"}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[color-mix(in_srgb,var(--color-warning)_14%,var(--color-surface))] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-warning-foreground,inherit)]">
                    <Clock className="h-3 w-3" aria-hidden />
                    Waiting
                  </span>
                </div>

                <div className="mt-3 flex items-baseline justify-between gap-2">
                  <span className="text-xs text-[var(--color-muted)]">
                    {item.lineCount} item{item.lineCount === 1 ? "" : "s"}
                  </span>
                  <span className="font-mono text-base font-bold tabular-nums text-[var(--color-foreground)]">
                    {formatMoney(Number(item.subtotal))}
                  </span>
                </div>

                <p className="mt-1.5 text-[11px] leading-snug text-[var(--color-muted)]">
                  {item.releasedByName ? `Released by ${item.releasedByName}` : "Released"}
                  {item.awaitingSettlementAt
                    ? ` · ${formatCompactDateTime(item.awaitingSettlementAt)}`
                    : ""}
                </p>

                <div className="mt-4 space-y-2">
                  <Button
                    type="button"
                    size="sm"
                    className="h-9 w-full text-sm"
                    disabled={actionsDisabled}
                    onClick={() => void handleGenerateBill(item)}
                  >
                    {generatingId === item.sessionId ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Opening POS…
                      </span>
                    ) : (
                      "Generate bill"
                    )}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-9 w-full border border-[var(--color-border)] text-sm"
                    disabled={actionsDisabled}
                    onClick={() => void handlePrintInterimBill(item)}
                    title="Print running total for the guest — does not take payment"
                  >
                    {isPrinting ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Printing…
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5">
                        <Receipt className="h-3.5 w-3.5" aria-hidden />
                        Interim bill
                      </span>
                    )}
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <ThermalPrintHost open={printDocument != null}>
        {printDocument?.kind === "interim" ? (
          <TableOrderInterimReceipt
            bill={printDocument.bill}
            id="waiting-settlement-interim-bill-print"
          />
        ) : null}
      </ThermalPrintHost>
    </section>
  );
}

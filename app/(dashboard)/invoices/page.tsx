"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Printer, ScanLine } from "lucide-react";
import { ThermalPrintHost } from "@/src/features/printing/components/thermal-print-host";
import { useThermalPrint } from "@/src/features/printing/hooks/use-thermal-print";
import { PosRecentSales } from "@/src/components/pos/pos-recent-sales";
import { PosSaleDetail } from "@/src/components/sales/pos-sale-detail";
import {
  PosSaleReceipt,
  type PosSaleReceiptData,
} from "@/src/components/sales/pos-sale-receipt";
import { PageHeader } from "@/src/components/shared/page-header";
import { ViewModalSkeleton } from "@/src/components/skeletons/view-modal-skeleton";
import { Button } from "@/src/components/ui/button";
import { Modal } from "@/src/components/ui/modal";
import { getApiErrorMessage } from "@/src/lib/api-error";
import { formatDateTime } from "@/src/lib/format-display";
import { appToast } from "@/src/lib/toast";
import { operationsApi } from "@/src/services/operations-api";

function InvoicesContent() {
  const router = useRouter();
  const [salesRefresh, setSalesRefresh] = useState(0);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewSale, setViewSale] = useState<PosSaleReceiptData | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  const { printDocument, isPrinting, requestPrint, printLoaded } =
    useThermalPrint<PosSaleReceiptData>({
      onError: (error) =>
        appToast.error(getApiErrorMessage(error, "Failed to load receipt for printing")),
    });

  const fetchSaleDetail = async (id: string) => {
    const detail = await operationsApi.sales.getOne(id);
    return detail as PosSaleReceiptData;
  };

  const openView = async (id: string) => {
    setViewLoading(true);
    setViewSale(null);
    setViewOpen(true);
    try {
      setViewSale(await fetchSaleDetail(id));
    } catch (error) {
      setViewOpen(false);
      appToast.error(getApiErrorMessage(error, "Failed to load invoice"));
    } finally {
      setViewLoading(false);
    }
  };

  const handlePrint = (id: string) => {
    void requestPrint(() => fetchSaleDetail(id));
  };

  return (
    <section className="page-shell page-content space-y-6 pb-10">
      <PageHeader
        title={
          <span className="inline-flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
              <FileText size={20} strokeWidth={1.75} aria-hidden />
            </span>
            Invoices
          </span>
        }
        description="Review completed POS sales, track payment status, and reprint receipts for your restaurant records."
        action={
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => router.push("/pos")}>
              <ScanLine className="mr-1.5 h-4 w-4" aria-hidden />
              Open POS
            </Button>
          </div>
        }
      />

      <PosRecentSales
        key={salesRefresh}
        variant="invoices"
        queryKey="invoices"
        emptyTitle="No invoices in this period"
        emptyDescription="Completed sales from POS will show here for the selected period. Try a wider date range or record a new sale."
        onView={(id) => void openView(id)}
        onPrint={(id) => void handlePrint(id)}
      />

      <Modal
        open={viewOpen}
        size="lg"
        title="Invoice details"
        description={
          viewSale
            ? `${viewSale.receiptNo} · ${formatDateTime(viewSale.saleAt)}`
            : "Loading invoice…"
        }
        onClose={() => {
          if (!viewLoading) {
            setViewOpen(false);
            setViewSale(null);
          }
        }}
      >
        <div className="space-y-5">
          {viewLoading ? (
            <ViewModalSkeleton rows={3} />
          ) : viewSale ? (
            <PosSaleDetail
              sale={viewSale}
              onSaleUpdated={(updated) => {
                setViewSale(updated);
                setSalesRefresh((n) => n + 1);
              }}
            />
          ) : null}
          <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--color-border)] pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setViewOpen(false);
                setViewSale(null);
              }}
              disabled={viewLoading}
            >
              Close
            </Button>
            {viewSale?.id ? (
              <Button
                type="button"
                disabled={isPrinting}
                onClick={() => printLoaded(viewSale)}
              >
                <Printer className="mr-1.5 h-4 w-4" />
                Print receipt
              </Button>
            ) : null}
          </div>
        </div>
      </Modal>

      <ThermalPrintHost open={printDocument != null}>
        {printDocument ? (
          <PosSaleReceipt sale={printDocument} id="invoice-sale-receipt-print" />
        ) : null}
      </ThermalPrintHost>
    </section>
  );
}

export default function InvoicesPage() {
  return (
    <Suspense
      fallback={
        <section className="page-shell page-content p-6 text-sm text-muted">
          Loading invoices…
        </section>
      }
    >
      <InvoicesContent />
    </Suspense>
  );
}

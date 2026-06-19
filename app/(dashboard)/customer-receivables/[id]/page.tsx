"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CustomerReceivableDetailSkeleton } from "@/src/components/sales/customer-receivable-detail-skeleton";
import {
  CustomerReceivableDetailView,
  type ReceivableBankAccountOption,
} from "@/src/components/sales/customer-receivable-detail-view";
import {
  CustomerReceivablePaymentReceipt,
} from "@/src/components/sales/customer-receivable-payment-receipt";
import {
  PosSaleReceipt,
  type PosSaleReceiptData,
} from "@/src/components/sales/pos-sale-receipt";
import { EmptyState } from "@/src/components/ui/empty-state";
import { ThermalPrintHost } from "@/src/features/printing/components/thermal-print-host";
import { useThermalPrint } from "@/src/features/printing/hooks/use-thermal-print";
import { getApiErrorMessage } from "@/src/lib/api-error";
import type {
  CustomerReceivableDetail,
  CustomerReceivablePaymentPrintResponse,
  CustomerReceivablePaymentReceiptData,
  FifoAllocationPreview,
  SalePaymentMethod,
} from "@/src/lib/ar-types";
import { appToast } from "@/src/lib/toast";
import { formatMoney } from "@/src/lib/format-display";
import { operationsApi } from "@/src/services/operations-api";

const AUTO_PRINT_STORAGE_KEY = "pos.autoPrintReceipt";

type ReceivablePrintDocument =
  | { printType: "sale"; sale: PosSaleReceiptData }
  | { printType: "payment"; payment: CustomerReceivablePaymentReceiptData };

export default function CustomerReceivableDetailPage() {
  const params = useParams<{ id: string }>();
  const customerId = params.id;

  const [detail, setDetail] = useState<CustomerReceivableDetail | null>(null);
  const [insights, setInsights] = useState<Awaited<
    ReturnType<typeof operationsApi.customers.summary>
  > | null>(null);
  const [loading, setLoading] = useState(true);
  const [amountStr, setAmountStr] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<SalePaymentMethod>("CASH");
  const [bankAccountId, setBankAccountId] = useState("");
  const [bankAccounts, setBankAccounts] = useState<ReceivableBankAccountOption[]>([]);
  const [remarks, setRemarks] = useState("");
  const [preview, setPreview] = useState<FifoAllocationPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [printingPaymentId, setPrintingPaymentId] = useState<string | null>(null);
  const [autoPrintReceipt, setAutoPrintReceipt] = useState(false);

  const { printDocument, isPrinting, requestPrint } = useThermalPrint<ReceivablePrintDocument>({
    onError: (error) =>
      appToast.error(getApiErrorMessage(error, "Failed to load receipt for printing")),
    onAfterPrint: () => setPrintingPaymentId(null),
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [d, s] = await Promise.all([
        operationsApi.customerReceivables.getCustomer(customerId),
        operationsApi.customers.summary(customerId).catch(() => null),
      ]);
      setDetail(d);
      setInsights(s);
    } catch (error) {
      setDetail(null);
      appToast.error(getApiErrorMessage(error, "Failed to load customer"));
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setAutoPrintReceipt(localStorage.getItem(AUTO_PRINT_STORAGE_KEY) === "true");
  }, []);

  const toggleAutoPrintReceipt = () => {
    setAutoPrintReceipt((prev) => {
      const next = !prev;
      localStorage.setItem(AUTO_PRINT_STORAGE_KEY, String(next));
      return next;
    });
  };

  useEffect(() => {
    if (loading || !detail) {
      return;
    }
    const shouldFocusPayment =
      new URLSearchParams(window.location.search).get("pay") === "1" ||
      window.location.hash === "#receivable-payment-panel";
    if (!shouldFocusPayment) {
      return;
    }
    const timer = window.setTimeout(() => {
      document.getElementById("receivable-payment-panel")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 150);
    return () => window.clearTimeout(timer);
  }, [detail, loading]);

  useEffect(() => {
    void operationsApi.bankAccounts
      .options()
      .then((items) => {
        setBankAccounts(items);
        if (items.length === 1) {
          setBankAccountId(items[0]!.id);
        }
      })
      .catch(() => setBankAccounts([]));
  }, []);

  useEffect(() => {
    if (paymentMethod === "BANK_TRANSFER") {
      if (!bankAccountId && bankAccounts[0]) {
        setBankAccountId(bankAccounts[0].id);
      }
    } else {
      setBankAccountId("");
    }
  }, [paymentMethod, bankAccountId, bankAccounts]);

  useEffect(() => {
    const amount = Number(amountStr);
    if (!detail || !Number.isFinite(amount) || amount <= 0) {
      setPreview(null);
      return;
    }
    const t = setTimeout(() => {
      setPreviewLoading(true);
      void operationsApi.customerReceivables
        .previewPayment({
          customerId,
          amount,
          paymentMethod,
          bankAccountId: paymentMethod === "BANK_TRANSFER" ? bankAccountId || undefined : undefined,
          remarks: remarks.trim() || undefined,
        })
        .then(setPreview)
        .catch(() => setPreview(null))
        .finally(() => setPreviewLoading(false));
    }, 400);
    return () => clearTimeout(t);
  }, [amountStr, paymentMethod, bankAccountId, remarks, customerId, detail]);

  const recordPayment = async () => {
    const amount = Number(amountStr);
    if (!detail || !Number.isFinite(amount) || amount <= 0) return;
    if (paymentMethod === "BANK_TRANSFER" && !bankAccountId) {
      appToast.error("Select a bank account for bank transfer");
      return;
    }
    setSaving(true);
    try {
      const result = await operationsApi.customerReceivables.recordPayment({
        customerId,
        amount,
        paymentMethod,
        bankAccountId: paymentMethod === "BANK_TRANSFER" ? bankAccountId : undefined,
        remarks: remarks.trim() || undefined,
      });
      appToast.success(
        Number(result.changeAmount) > 0.005
          ? `Payment ${result.receiptNo} recorded · return ${formatMoney(result.changeAmount)} change`
          : `Payment ${result.receiptNo} recorded`,
      );
      setAmountStr("");
      setRemarks("");
      setBankAccountId(bankAccounts[0]?.id ?? "");
      setPreview(null);
      await load();
      if (localStorage.getItem(AUTO_PRINT_STORAGE_KEY) === "true") {
        setPrintingPaymentId(result.id);
        void requestPrint(async () => {
          const response = await operationsApi.customerReceivables.getPaymentPrint(
            result.id,
            "CRP",
          );
          return mapPrintResponse(response);
        }).catch(() => setPrintingPaymentId(null));
      }
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to record payment"));
    } finally {
      setSaving(false);
    }
  };

  const mapPrintResponse = (response: CustomerReceivablePaymentPrintResponse): ReceivablePrintDocument => {
    if (response.printType === "sale") {
      return { printType: "sale", sale: response.sale as PosSaleReceiptData };
    }
    return { printType: "payment", payment: response.payment };
  };

  const handlePrintPayment = (
    paymentId: string,
    kind: CustomerReceivableDetail["paymentHistory"][number]["kind"],
  ) => {
    setPrintingPaymentId(paymentId);
    void requestPrint(async () => {
      const response = await operationsApi.customerReceivables.getPaymentPrint(paymentId, kind);
      return mapPrintResponse(response);
    }).catch(() => setPrintingPaymentId(null));
  };

  if (loading) {
    return <CustomerReceivableDetailSkeleton />;
  }

  if (!detail) {
    return (
      <EmptyState
        title="Customer not found"
        description="This customer may have been removed or you may not have access."
        action={{
          label: "Back to receivables",
          onClick: () => {
            window.location.href = "/customer-receivables";
          },
        }}
      />
    );
  }

  return (
    <>
      <CustomerReceivableDetailView
        detail={detail}
        insights={insights}
        amountStr={amountStr}
        onAmountStrChange={setAmountStr}
        paymentMethod={paymentMethod}
        onPaymentMethodChange={setPaymentMethod}
        bankAccountId={bankAccountId}
        onBankAccountIdChange={setBankAccountId}
        bankAccounts={bankAccounts}
        remarks={remarks}
        onRemarksChange={setRemarks}
        preview={preview}
        previewLoading={previewLoading}
        saving={saving}
        isPrinting={isPrinting}
        autoPrintReceipt={autoPrintReceipt}
        onAutoPrintReceiptChange={toggleAutoPrintReceipt}
        onSubmit={() => void recordPayment()}
        onPrintPayment={handlePrintPayment}
        printingPaymentId={printingPaymentId}
      />

      <ThermalPrintHost open={printDocument != null}>
        {printDocument?.printType === "sale" ? (
          <PosSaleReceipt sale={printDocument.sale} id="customer-receivable-sale-receipt-print" />
        ) : printDocument?.printType === "payment" ? (
          <CustomerReceivablePaymentReceipt
            payment={printDocument.payment}
            id="customer-receivable-payment-receipt-print"
          />
        ) : null}
      </ThermalPrintHost>
    </>
  );
}

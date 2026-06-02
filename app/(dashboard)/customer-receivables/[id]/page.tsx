"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { HandCoins } from "lucide-react";
import { CustomerReceivableDetailSkeleton } from "@/src/components/sales/customer-receivable-detail-skeleton";
import { CustomerReceivableDetailView } from "@/src/components/sales/customer-receivable-detail-view";
import type { SalePaymentMode } from "@/src/components/sales/record-sale-payment-section";
import type { PosSaleReceiptData } from "@/src/components/sales/pos-sale-receipt";
import { EmptyState } from "@/src/components/ui/empty-state";
import { getApiErrorMessage } from "@/src/lib/api-error";
import type { SalePaymentMethod } from "@/src/lib/ar-types";
import { parseMoneyInput, roundMoneyStr } from "@/src/lib/money-input";
import { appToast } from "@/src/lib/toast";
import { operationsApi } from "@/src/services/operations-api";

export default function CustomerReceivableDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [sale, setSale] = useState<PosSaleReceiptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [payMode, setPayMode] = useState<SalePaymentMode>("FULL");
  const [amountStr, setAmountStr] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<SalePaymentMethod>("CASH");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [chequeBankName, setChequeBankName] = useState("");
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await operationsApi.customerReceivables.getOne(id);
      setSale(data as PosSaleReceiptData);
    } catch (error) {
      setSale(null);
      appToast.error(getApiErrorMessage(error, "Failed to load receivable"));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const recordPayment = async () => {
    if (!sale?.id) return;
    const remaining = Number(sale.remainingAmount ?? sale.creditAmount);
    const roundedRemaining = Math.round(remaining * 100) / 100;
    const parsed = parseMoneyInput(amountStr);
    const amount =
      payMode === "FULL" ? roundedRemaining : parsed.invalid ? 0 : parsed.amount;

    if (amount <= 0) {
      appToast.error("Enter a valid payment amount");
      return;
    }

    setSaving(true);
    try {
      await operationsApi.sales.recordPayment(sale.id, {
        amount,
        paymentMethod,
        referenceNumber: referenceNumber.trim() || undefined,
        chequeBankName: paymentMethod === "CHEQUE" ? chequeBankName.trim() : undefined,
        remarks: remarks.trim() || undefined,
      });
      const updated = await operationsApi.sales.getOne(sale.id);
      setSale(updated as PosSaleReceiptData);
      appToast.success("Payment recorded");
      setAmountStr("");
      setRemarks("");
      setReferenceNumber("");
      setChequeBankName("");
      setPayMode("FULL");
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to record payment"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <CustomerReceivableDetailSkeleton />;
  }

  if (!sale) {
    return (
      <section className="page-shell page-content">
        <EmptyState
          variant="empty"
          title="Receivable not found"
          description="This sale may have been removed or you may not have access."
          icon={HandCoins}
          action={{
            label: "Back to receivables",
            onClick: () => {
              window.location.href = "/customer-receivables";
            },
          }}
        />
      </section>
    );
  }

  return (
    <CustomerReceivableDetailView
      sale={sale}
      paymentForm={{
        payMode,
        onPayModeChange: (m) => {
          setPayMode(m);
          const remaining = Number(sale.remainingAmount ?? sale.creditAmount);
          if (m === "FULL") {
            setAmountStr(roundMoneyStr(remaining));
          } else {
            setAmountStr("");
          }
        },
        amountStr,
        onAmountStrChange: setAmountStr,
        paymentMethod,
        onPaymentMethodChange: setPaymentMethod,
        referenceNumber,
        onReferenceNumberChange: setReferenceNumber,
        chequeBankName,
        onChequeBankNameChange: setChequeBankName,
        remarks,
        onRemarksChange: setRemarks,
        saving,
        onSubmit: () => void recordPayment(),
      }}
    />
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CustomerReceivableDetailSkeleton } from "@/src/components/sales/customer-receivable-detail-skeleton";
import { CustomerReceivableDetailView } from "@/src/components/sales/customer-receivable-detail-view";
import { EmptyState } from "@/src/components/ui/empty-state";
import { getApiErrorMessage } from "@/src/lib/api-error";
import type {
  CustomerReceivableDetail,
  FifoAllocationPreview,
  SalePaymentMethod,
} from "@/src/lib/ar-types";
import { appToast } from "@/src/lib/toast";
import { operationsApi } from "@/src/services/operations-api";

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
  const [remarks, setRemarks] = useState("");
  const [preview, setPreview] = useState<FifoAllocationPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [saving, setSaving] = useState(false);

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
          remarks: remarks.trim() || undefined,
        })
        .then(setPreview)
        .catch(() => setPreview(null))
        .finally(() => setPreviewLoading(false));
    }, 400);
    return () => clearTimeout(t);
  }, [amountStr, paymentMethod, remarks, customerId, detail]);

  const recordPayment = async () => {
    const amount = Number(amountStr);
    if (!detail || !Number.isFinite(amount) || amount <= 0) return;
    setSaving(true);
    try {
      const result = await operationsApi.customerReceivables.recordPayment({
        customerId,
        amount,
        paymentMethod,
        remarks: remarks.trim() || undefined,
      });
      appToast.success(`Payment ${result.receiptNo} recorded`);
      setAmountStr("");
      setRemarks("");
      setPreview(null);
      await load();
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to record payment"));
    } finally {
      setSaving(false);
    }
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
    <CustomerReceivableDetailView
      detail={detail}
      insights={insights}
      amountStr={amountStr}
      onAmountStrChange={setAmountStr}
      paymentMethod={paymentMethod}
      onPaymentMethodChange={setPaymentMethod}
      remarks={remarks}
      onRemarksChange={setRemarks}
      preview={preview}
      previewLoading={previewLoading}
      saving={saving}
      onSubmit={() => void recordPayment()}
    />
  );
}

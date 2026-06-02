"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Receipt } from "lucide-react";
import type { BillPaymentMode } from "@/src/components/purchases/record-bill-payment-section";
import { SupplierBillDetailSkeleton } from "@/src/components/purchases/supplier-bill-detail-skeleton";
import { SupplierBillDetailView } from "@/src/components/purchases/supplier-bill-detail-view";
import { ImageUploadField } from "@/src/components/shared/image-upload-field";
import { EmptyState } from "@/src/components/ui/empty-state";
import type { ApBillDetail, PurchasePaymentMethod } from "@/src/lib/ap-types";
import { getApiErrorMessage } from "@/src/lib/api-error";
import { parseMoneyInput } from "@/src/lib/money-input";
import { appToast } from "@/src/lib/toast";
import { operationsApi } from "@/src/services/operations-api";

export default function SupplierBillDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [bill, setBill] = useState<ApBillDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [payMode, setPayMode] = useState<BillPaymentMode>("PARTIAL");
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState<PurchasePaymentMethod>("CASH");
  const [payRef, setPayRef] = useState("");
  const [payRemarks, setPayRemarks] = useState("");
  const [payProof, setPayProof] = useState("");
  const [saving, setSaving] = useState(false);
  const [notesEdit, setNotesEdit] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await operationsApi.rmPurchases.getOne(id);
      setBill(data);
      setNotesEdit(data.notes ?? "");
    } catch (error) {
      setBill(null);
      appToast.error(getApiErrorMessage(error, "Failed to load bill"));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const remaining = bill ? Number(bill.remainingAmount) : 0;

  const recordPayment = async () => {
    const parsed = parseMoneyInput(payMode === "FULL" ? String(remaining) : payAmount);
    const amount = payMode === "FULL" ? remaining : parsed.amount;

    if (parsed.invalid && payMode === "PARTIAL") {
      appToast.error("Enter a valid payment amount");
      return;
    }
    if (amount <= 0) {
      appToast.error("Payment amount must be greater than zero");
      return;
    }
    if (amount > remaining + 0.005) {
      appToast.error("Payment amount cannot exceed outstanding balance");
      return;
    }
    if (payMode === "PARTIAL" && amount >= remaining - 0.004) {
      appToast.error("Switch to Full balance to pay the entire amount");
      return;
    }
    if (payMethod === "BANK_TRANSFER" && !payProof.trim()) {
      appToast.error("Bank transfer proof is required");
      return;
    }

    setSaving(true);
    try {
      await operationsApi.rmPurchases.recordPayment(id, {
        amount,
        paymentMethod: payMethod,
        referenceNumber: payRef.trim() || undefined,
        remarks: payRemarks.trim() || undefined,
        proofAttachmentUrl: payMethod === "BANK_TRANSFER" ? payProof.trim() : undefined,
      });
      appToast.success(payMode === "FULL" ? "Bill paid in full" : "Partial payment recorded");
      setPayMode("PARTIAL");
      setPayAmount("");
      setPayRef("");
      setPayRemarks("");
      setPayProof("");
      await load();
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to record payment"));
    } finally {
      setSaving(false);
    }
  };

  const saveNotes = async () => {
    setSavingNotes(true);
    try {
      await operationsApi.rmPurchases.updateHeader(id, { notes: notesEdit });
      appToast.success("Notes saved");
      await load();
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to save notes"));
    } finally {
      setSavingNotes(false);
    }
  };

  if (loading) {
    return <SupplierBillDetailSkeleton />;
  }

  if (!bill) {
    return (
      <section className="page-shell page-content">
        <EmptyState
          variant="empty"
          title="Bill not found"
          description="This bill may have been removed or you may not have access."
          icon={Receipt}
          action={{
            label: "Back to supplier bills",
            onClick: () => {
              window.location.href = "/supplier-bills";
            },
          }}
        />
      </section>
    );
  }

  return (
    <SupplierBillDetailView
      bill={bill}
      notesEdit={notesEdit}
      onNotesChange={setNotesEdit}
      onSaveNotes={() => void saveNotes()}
      savingNotes={savingNotes}
      paymentForm={{
        payMode,
        onPayModeChange: setPayMode,
        payAmount,
        onPayAmountChange: setPayAmount,
        payMethod,
        onPayMethodChange: setPayMethod,
        payRef,
        onPayRefChange: setPayRef,
        payRemarks,
        onPayRemarksChange: setPayRemarks,
        payProof,
        onPayProofChange: setPayProof,
        saving,
        onSubmit: () => void recordPayment(),
        bankProofSlot:
          payMethod === "BANK_TRANSFER" ? (
            <ImageUploadField
              id="billPayProof"
              label="Bank transfer proof"
              required
              value={payProof}
              onChange={setPayProof}
              assetType="module"
              module="raw-material-purchases"
              entityId={id}
              dropTitle="Drop proof here"
              recommendedSize="PNG or JPG, max 5MB"
            />
          ) : undefined,
      }}
    />
  );
}

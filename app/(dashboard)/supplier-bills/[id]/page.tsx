"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ChevronRight,
  CircleCheckBig,
  HandCoins,
  History,
  MapPin,
  Phone,
  Receipt,
  User,
} from "lucide-react";
import { SupplierBillDetailSkeleton } from "@/src/components/purchases/supplier-bill-detail-skeleton";
import { PurchaseHistorySection } from "@/src/components/purchases/purchase-history-section";
import { EmptyState } from "@/src/components/ui/empty-state";
import type { BillSettlementSupplierDetail, PurchasePaymentMethod } from "@/src/lib/ap-types";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Field } from "@/src/components/ui/field";
import { Input } from "@/src/components/ui/input";
import { Select } from "@/src/components/ui/select";
import { getApiErrorMessage } from "@/src/lib/api-error";
import { formatDateOnly, formatDateTime, formatMoney } from "@/src/lib/format-display";
import { parseMoneyInput } from "@/src/lib/money-input";
import { appToast } from "@/src/lib/toast";
import { operationsApi } from "@/src/services/operations-api";

export default function SupplierBillDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [detail, setDetail] = useState<BillSettlementSupplierDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState<PurchasePaymentMethod>("CASH");
  const [payRemarks, setPayRemarks] = useState("");
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<{
    allocations: Array<{ purchaseId: string; receiptNo: string; amount: string }>;
    remainingOutstanding: string;
  } | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [activeTab, setActiveTab] = useState<"purchases" | "payments">("purchases");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await operationsApi.billSettlement.getSupplier(id);
      setDetail(data);
    } catch (error) {
      setDetail(null);
      appToast.error(getApiErrorMessage(error, "Failed to load supplier settlement"));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const remaining = detail ? Number(detail.supplier.outstandingAmount) : 0;
  const groupedPayments = useMemo(() => {
    const groups = new Map<string, { receipt: string; total: number; rows: BillSettlementSupplierDetail["paymentHistory"] }>();
    for (const payment of detail?.paymentHistory ?? []) {
      const key = payment.settlementBatchId ?? payment.id;
      const receipt = payment.settlementReceiptNo ?? payment.receiptNo;
      const existing = groups.get(key);
      if (existing) {
        existing.total += Number(payment.amount);
        existing.rows.push(payment);
      } else {
        groups.set(key, {
          receipt,
          total: Number(payment.amount),
          rows: [payment],
        });
      }
    }
    return [...groups.values()];
  }, [detail]);
  const parsedAmount = parseMoneyInput(payAmount);
  const canSettle =
    remaining > 0.005 &&
    !parsedAmount.invalid &&
    parsedAmount.amount > 0 &&
    parsedAmount.amount <= remaining + 0.005;
  const postSettlementOutstanding =
    !parsedAmount.invalid && parsedAmount.amount > 0
      ? Math.max(0, remaining - parsedAmount.amount)
      : remaining;
  const mobilePresetAmounts = [Math.min(remaining, 500), Math.min(remaining, 1000), remaining].filter(
    (v, i, arr) => v > 0 && arr.indexOf(v) === i,
  );

  const previewPayment = async () => {
    const parsed = parseMoneyInput(payAmount);
    const amount = parsed.amount;
    if (parsed.invalid || amount <= 0) {
      setPreview(null);
      return;
    }
    setPreviewing(true);
    try {
      const res = await operationsApi.billSettlement.previewPayment({
        supplierId: id,
        amount,
        paymentMethod: payMethod,
        remarks: payRemarks.trim() || undefined,
      });
      setPreview({
        allocations: res.allocations ?? [],
        remainingOutstanding: res.remainingOutstanding,
      });
    } catch {
      setPreview(null);
    } finally {
      setPreviewing(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      void previewPayment();
    }, 350);
    return () => clearTimeout(t);
  }, [payAmount, payMethod, payRemarks]);

  const recordPayment = async () => {
    const parsed = parseMoneyInput(payAmount);
    const amount = parsed.amount;
    if (parsed.invalid) {
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
    setSaving(true);
    try {
      await operationsApi.billSettlement.recordPayment({
        supplierId: id,
        amount,
        paymentMethod: payMethod,
        remarks: payRemarks.trim() || undefined,
      });
      appToast.success("Settlement recorded");
      setPayAmount("");
      setPayRemarks("");
      setPreview(null);
      await load();
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to settle supplier balance"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <SupplierBillDetailSkeleton />;
  }

  if (!detail) {
    return (
      <section className="page-shell page-content">
        <EmptyState
          variant="empty"
          title="Supplier not found"
          description="This supplier settlement view may be unavailable or access is restricted."
          icon={Receipt}
          action={{
            label: "Back to bill settlement",
            onClick: () => {
              window.location.href = "/bill-settlement";
            },
          }}
        />
      </section>
    );
  }

  return (
    <div className="page-shell page-content space-y-6 pb-24 lg:pb-10">
      <nav className="flex items-center gap-2 text-sm text-muted">
        <Link href="/bill-settlement" className="inline-flex items-center gap-1 hover:text-[var(--color-primary)]">
          <ArrowLeft className="h-4 w-4" />
          Suppliers Payables
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-medium text-foreground">{detail.supplier.name}</span>
      </nav>

      <Card className="border-[var(--color-border)] p-4 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-3 min-w-0">
            <div className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
              <User className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold">{detail.supplier.name}</h1>
              {detail.supplier.phone ? (
                <p className="mt-0.5 flex items-center gap-1 text-sm text-muted font-mono tabular-nums">
                  <Phone className="h-3.5 w-3.5" />
                  {detail.supplier.phone}
                </p>
              ) : null}
              {detail.supplier.address ? (
                <p className="mt-1 flex items-start gap-1 text-sm text-muted">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span className="line-clamp-2">{detail.supplier.address}</span>
                </p>
              ) : null}
              {detail.supplier.contactPerson ? (
                <p className="mt-1 text-xs text-muted">Contact: {detail.supplier.contactPerson}</p>
              ) : null}
            </div>
          </div>
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-cream-50)] px-4 py-3 text-right">
            <p className="text-[11px] uppercase tracking-wide text-muted">Outstanding amount</p>
            <p className="font-mono text-2xl font-bold tabular-nums tone-warning-text leading-tight">
              {formatMoney(detail.supplier.outstandingAmount)}
            </p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Total purchases" value={formatMoney(detail.supplier.totalPurchases)} />
          <Stat label="Total paid" value={formatMoney(detail.supplier.totalPaid)} />
          <Stat label="Open bills" value={String(detail.supplier.openBillsCount)} />
          <Stat
            label="Last purchase"
            value={detail.supplier.lastPurchaseAt ? formatDateOnly(detail.supplier.lastPurchaseAt) : "—"}
          />
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="space-y-6">
          <div className="flex gap-2 md:hidden">
            <Button
              type="button"
              size="sm"
              variant={activeTab === "purchases" ? "soft" : "secondary"}
              onClick={() => setActiveTab("purchases")}
              className="flex-1"
            >
              Purchases
            </Button>
            <Button
              type="button"
              size="sm"
              variant={activeTab === "payments" ? "soft" : "secondary"}
              onClick={() => setActiveTab("payments")}
              className="flex-1"
            >
              Payments
            </Button>
          </div>

          <section className={activeTab === "payments" ? "hidden md:block" : ""}>
            <PurchaseHistorySection bills={detail.purchaseHistory} />
          </section>

          <section className={activeTab === "purchases" ? "hidden md:block" : ""}>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <History className="h-4 w-4" />
              Payment history
            </h2>
            {groupedPayments.length === 0 ? (
              <Card className="p-6 text-sm text-muted border-[var(--color-border)]">
                No settlements recorded yet.
              </Card>
            ) : (
              <ul className="space-y-2">
                {groupedPayments.map((g, idx) => (
                  <li key={`${g.receipt}-${idx}`} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono font-medium">{g.receipt}</span>
                      <span className="font-mono font-semibold tabular-nums">{formatMoney(g.total)}</span>
                    </div>
                    <ul className="mt-2 space-y-0.5 border-t border-[var(--color-border)] pt-2 text-xs text-muted">
                      {g.rows.map((r) => (
                        <li key={r.id} className="flex items-center justify-between gap-3">
                          <span>
                            {r.purchaseReceiptNo} · {formatDateTime(r.paymentDate)}
                          </span>
                          <span className="font-mono tabular-nums">{formatMoney(r.amount)}</span>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {remaining > 0.005 ? (
          <section
            id="bill-settlement-payment-panel"
            className="order-first h-fit rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)] xl:order-none xl:sticky xl:top-4"
          >
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <HandCoins className="h-4 w-4" />
              Record settlement (FIFO)
            </h2>

            <div className="mb-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-cream-50)] px-3 py-2.5">
              <p className="text-xs uppercase tracking-wide text-muted">Outstanding now</p>
              <p className="font-mono text-xl font-bold tabular-nums tone-warning-text">
                {formatMoney(detail.supplier.outstandingAmount)}
              </p>
              {!parsedAmount.invalid && parsedAmount.amount > 0 ? (
                <p className="mt-1 text-xs text-muted">
                  After settlement:{" "}
                  <span className="font-mono tabular-nums text-foreground">
                    {formatMoney(postSettlementOutstanding)}
                  </span>
                </p>
              ) : null}
            </div>

            <div className="space-y-3">
              <Field id="bsp-payment-amount" label="Payment amount" required>
                <Input
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  inputMode="decimal"
                  placeholder="0.00"
                />
              </Field>

              <div className="flex flex-wrap gap-1.5">
                {mobilePresetAmounts.map((amt) => (
                  <Button
                    key={amt}
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="h-8 px-2.5 text-xs"
                    onClick={() => setPayAmount(String(amt))}
                  >
                    {amt === remaining ? "Settle full" : formatMoney(amt)}
                  </Button>
                ))}
              </div>

              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-cream-50)]/50 p-3">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
                  Allocation preview
                </p>
                {previewing ? (
                  <p className="text-sm text-muted">Calculating…</p>
                ) : preview && preview.allocations.length > 0 ? (
                  <ul className="space-y-1.5">
                    {preview.allocations.map((a) => (
                      <li key={a.purchaseId} className="flex items-center justify-between text-sm font-mono tabular-nums">
                        <span>{a.receiptNo}</span>
                        <span>{formatMoney(a.amount)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted">Enter an amount to preview allocation.</p>
                )}
              </div>

              <Field id="bsp-payment-method" label="Payment method" required>
                <Select searchable={false} value={payMethod} onChange={(e) => setPayMethod(e.target.value as PurchasePaymentMethod)}>
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank transfer</option>
                  <option value="ESEWA">eSewa</option>
                  <option value="KHALTI">Khalti</option>
                  <option value="CHEQUE">Cheque</option>
                </Select>
              </Field>
              <Field id="bsp-payment-remarks" label="Remarks">
                <Input value={payRemarks} onChange={(e) => setPayRemarks(e.target.value)} />
              </Field>

              <Button
                type="button"
                className="w-full"
                disabled={!canSettle || saving}
                onClick={() => void recordPayment()}
                loading={saving}
              >
                Confirm settlement
              </Button>
              {canSettle ? (
                <p className="flex items-center gap-1 text-xs text-muted">
                  <CircleCheckBig className="h-3.5 w-3.5 text-emerald-600" />
                  Payment will settle oldest unpaid bills first.
                </p>
              ) : null}
            </div>
          </section>
        ) : null}
      </div>

      {remaining > 0.005 ? (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--color-border)] bg-[var(--color-surface)]/95 px-4 py-3 backdrop-blur safe-bottom xl:hidden">
          <div className="mx-auto flex max-w-[900px] items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wide text-muted">Outstanding</p>
              <p className="font-mono text-base font-semibold tabular-nums tone-warning-text">
                {formatMoney(detail.supplier.outstandingAmount)}
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              className="h-10 px-4"
              onClick={() =>
                document
                  .getElementById("bill-settlement-payment-panel")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" })
              }
            >
              Record settlement
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5">
      <p className="text-[11px] uppercase tracking-wide text-muted">{label}</p>
      <p className="font-medium tabular-nums text-foreground">{value}</p>
    </div>
  );
}

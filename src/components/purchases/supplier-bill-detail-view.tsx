"use client";

import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  FileText,
  Hash,
  Package,
  StickyNote,
} from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { BillStatusBadge, PaymentStatusBadge } from "@/src/components/purchases/ap-status-badges";
import {
  RecordBillPaymentSection,
  type BillPaymentMode,
} from "@/src/components/purchases/record-bill-payment-section";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/cn";
import type { ApBillDetail, PurchasePaymentMethod } from "@/src/lib/ap-types";
import { formatPurchasePaymentMethodWithBank } from "@/src/lib/ap-display";
import { formatDateOnly, formatDateTime, formatMoney } from "@/src/lib/format-display";

type PaymentFormProps = {
  payMode: BillPaymentMode;
  onPayModeChange: (m: BillPaymentMode) => void;
  payAmount: string;
  onPayAmountChange: (v: string) => void;
  payMethod: PurchasePaymentMethod;
  onPayMethodChange: (m: PurchasePaymentMethod) => void;
  payRef: string;
  onPayRefChange: (v: string) => void;
  payRemarks: string;
  onPayRemarksChange: (v: string) => void;
  payProof: string;
  onPayProofChange: (v: string) => void;
  saving: boolean;
  onSubmit: () => void;
  bankProofSlot?: ReactNode;
};

type Props = {
  bill: ApBillDetail;
  notesEdit: string;
  onNotesChange: (v: string) => void;
  onSaveNotes: () => void;
  savingNotes: boolean;
  paymentForm: PaymentFormProps;
};

function MetaRow({ icon: Icon, label, value }: { icon: typeof Hash; label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-muted)] text-[var(--color-muted)]">
        <Icon className="size-4" strokeWidth={1.75} aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-subtle)]">{label}</p>
        <p className="text-sm font-medium text-[var(--color-foreground)] break-words">{value}</p>
      </div>
    </div>
  );
}

function SidebarCard({
  title,
  icon: Icon,
  children,
  className,
}: {
  title: string;
  icon: typeof Building2;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]/50 px-4 py-3">
        <Icon className="size-4 text-[var(--color-muted)]" strokeWidth={1.75} aria-hidden />
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export function SupplierBillDetailView({
  bill,
  notesEdit,
  onNotesChange,
  onSaveNotes,
  savingNotes,
  paymentForm,
}: Props) {
  const total = Number(bill.grandTotal);
  const paid = Number(bill.paidAmount);
  const remaining = Number(bill.remainingAmount);
  const paidPercent = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
  const isClosed = remaining < 0.005;
  const isOverdue = bill.billStatus === "OVERDUE";
  const [mobileTab, setMobileTab] = useState<"payments" | "items">("payments");

  return (
    <div className="page-shell page-content pb-10">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1.5 text-sm">
        <Link
          href="/bill-settlement"
          className="inline-flex items-center gap-1 text-[var(--color-muted)] transition-colors hover:text-[var(--color-primary)]"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Suppliers Payables
        </Link>
        <ChevronRight className="size-3.5 text-[var(--color-subtle)]" aria-hidden />
        <span className="font-medium text-[var(--color-foreground)]">{bill.receiptNo}</span>
      </nav>

      {/* Hero */}
      <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]">
        <div className="border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]/40 px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-subtle)]">
                Purchase receipt
              </p>
              <h1 className="mt-0.5 text-2xl font-semibold tracking-tight text-[var(--color-foreground)] sm:text-3xl">
                {bill.receiptNo}
              </h1>
              <p className="mt-1 text-sm text-[var(--color-muted)]">{bill.supplierName ?? "Supplier"}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <BillStatusBadge status={bill.billStatus} />
                <PaymentStatusBadge status={bill.paymentStatus} />
              </div>
            </div>
            {bill.supplierInvoiceNo ? (
              <div className="shrink-0 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-right">
                <p className="text-[10px] uppercase tracking-wider text-[var(--color-subtle)]">Invoice</p>
                <p className="text-sm font-medium tabular-nums">{bill.supplierInvoiceNo}</p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="grid gap-6 p-4 sm:grid-cols-[1fr_auto] sm:items-end sm:p-6">
          <div>
            <p className="text-xs font-medium text-[var(--color-muted)]">
              {isClosed ? "Balance due" : "Amount due"}
            </p>
            <p
              className={cn(
                "mt-1 text-3xl font-semibold tabular-nums tracking-tight sm:text-4xl",
                isClosed ? "text-[var(--color-success)]" : "text-[var(--color-foreground)]",
              )}
            >
              {isClosed ? formatMoney(0) : formatMoney(remaining)}
            </p>
            <div className="mt-4">
              <div className="mb-1.5 flex justify-between text-xs text-[var(--color-muted)]">
                <span>
                  Paid {formatMoney(paid)} of {formatMoney(total)}
                </span>
                <span className="font-medium tabular-nums">{paidPercent}%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-[var(--color-border)]">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    isClosed ? "bg-[var(--color-success)]" : "bg-[var(--color-primary)]",
                  )}
                  style={{ width: `${paidPercent}%` }}
                />
              </div>
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-1 sm:text-right">
            <div>
              <dt className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-subtle)]">Total</dt>
              <dd className="font-semibold tabular-nums">{formatMoney(total)}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-subtle)]">Paid</dt>
              <dd className="font-semibold tabular-nums text-[var(--color-success)]">{formatMoney(paid)}</dd>
            </div>
          </dl>
        </div>

        {isOverdue && !isClosed ? (
          <div className="flex items-start gap-3 border-t border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5 px-4 py-3 sm:px-6">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[var(--color-danger)]" aria-hidden />
            <p className="text-sm text-[var(--color-foreground)]">
              This bill is <span className="font-semibold">overdue</span>
              {bill.dueDate ? ` (due ${formatDateOnly(bill.dueDate)})` : ""}. Record a payment to update the balance.
            </p>
          </div>
        ) : null}

        {isClosed ? (
          <div className="flex items-center gap-3 border-t border-[var(--color-success)]/20 bg-[var(--color-success)]/5 px-4 py-4 sm:px-6">
            <CheckCircle2 className="size-5 shrink-0 text-[var(--color-success)]" aria-hidden />
            <div>
              <p className="text-sm font-medium text-[var(--color-foreground)]">This bill is fully paid</p>
              <p className="text-xs text-[var(--color-muted)]">
                {bill.lastPaymentDate
                  ? `Last payment on ${formatDateOnly(bill.lastPaymentDate)}`
                  : "No further payment required"}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {/* Body */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3 lg:items-start">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          {!isClosed ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    paymentForm.onPayModeChange("PARTIAL");
                    paymentForm.onPayAmountChange((remaining / 2).toFixed(2));
                  }}
                >
                  Pay 50%
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    paymentForm.onPayModeChange("PARTIAL");
                    paymentForm.onPayAmountChange((remaining / 4).toFixed(2));
                  }}
                >
                  Pay 25%
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="soft"
                  onClick={() => {
                    paymentForm.onPayModeChange("FULL");
                    paymentForm.onPayAmountChange(String(remaining));
                  }}
                >
                  Pay full
                </Button>
              </div>
              <RecordBillPaymentSection
                className="border-t-0 pt-0"
                remainingBalance={remaining}
                mode={paymentForm.payMode}
                onModeChange={paymentForm.onPayModeChange}
                amountStr={paymentForm.payAmount}
                onAmountStrChange={paymentForm.onPayAmountChange}
                paymentMethod={paymentForm.payMethod}
                onPaymentMethodChange={paymentForm.onPayMethodChange}
                referenceNumber={paymentForm.payRef}
                onReferenceNumberChange={paymentForm.onPayRefChange}
                remarks={paymentForm.payRemarks}
                onRemarksChange={paymentForm.onPayRemarksChange}
                saving={paymentForm.saving}
                onSubmit={paymentForm.onSubmit}
                bankProofSlot={paymentForm.bankProofSlot}
              />
            </div>
          ) : null}

          {/* Payment history */}
          <div className={cn("overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]", mobileTab === "items" ? "hidden md:block" : "")}>
            <div className="flex items-center justify-between gap-2 border-b border-[var(--color-border)] px-4 py-3 sm:px-5">
              <h2 className="text-sm font-semibold text-[var(--color-foreground)]">Payment history</h2>
              <span className="rounded-full bg-[var(--color-surface-muted)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-muted)]">
                {bill.payments.length} {bill.payments.length === 1 ? "payment" : "payments"}
              </span>
            </div>

            {bill.payments.length === 0 ? (
              <div className="px-4 py-12 text-center sm:px-5">
                <p className="text-sm font-medium text-[var(--color-foreground)]">No payments yet</p>
                <p className="mt-1 text-xs text-[var(--color-muted)]">
                  Payments you record will appear here with receipt numbers.
                </p>
              </div>
            ) : (
              <>
                <ul className="divide-y divide-[var(--color-border)] md:hidden">
                  {bill.payments.map((p) => (
                    <li key={p.id} className="px-4 py-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold tabular-nums">{p.receiptNo}</p>
                          <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                            {formatDateOnly(p.paymentDate)} ·{" "}
                            {formatPurchasePaymentMethodWithBank(p)}
                          </p>
                        </div>
                        <p className="text-sm font-semibold tabular-nums text-[var(--color-success)]">
                          {formatMoney(p.amount)}
                        </p>
                      </div>
                      {(p.referenceNumber || p.remarks) && (
                        <p className="mt-2 text-xs text-[var(--color-muted)] leading-relaxed">
                          {[p.referenceNumber, p.remarks].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full min-w-[36rem] text-left text-sm">
                    <thead>
                      <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]/40 text-xs uppercase tracking-wide text-[var(--color-muted)]">
                        <th className="px-4 py-2.5 font-medium">Receipt</th>
                        <th className="px-4 py-2.5 font-medium">Date</th>
                        <th className="px-4 py-2.5 font-medium text-right">Amount</th>
                        <th className="px-4 py-2.5 font-medium">Method</th>
                        <th className="px-4 py-2.5 font-medium">Reference</th>
                        <th className="px-4 py-2.5 font-medium">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bill.payments.map((p) => (
                        <tr
                          key={p.id}
                          className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-muted)]/50"
                        >
                          <td className="px-4 py-3 font-medium tabular-nums">{p.receiptNo}</td>
                          <td className="px-4 py-3 text-[var(--color-muted)] whitespace-nowrap">
                            {formatDateOnly(p.paymentDate)}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold tabular-nums">
                            {formatMoney(p.amount)}
                          </td>
                          <td className="px-4 py-3">
                            {formatPurchasePaymentMethodWithBank(p)}
                          </td>
                          <td className="px-4 py-3 text-[var(--color-muted)]">{p.referenceNumber ?? "—"}</td>
                          <td className="px-4 py-3 text-[var(--color-muted)] max-w-[12rem] truncate" title={p.remarks ?? undefined}>
                            {p.remarks ?? "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          {/* Line items */}
          <div className={cn("overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]", mobileTab === "payments" ? "hidden md:block" : "")}>
            <div className="flex items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]/50 px-4 py-3">
              <Package className="size-4 text-[var(--color-muted)]" aria-hidden />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                Line items ({bill.lines.length})
              </h2>
            </div>
            <ul className="divide-y divide-[var(--color-border)]">
              {bill.lines.map((line) => (
                <li key={line.id} className="flex items-start justify-between gap-4 px-4 py-3.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--color-foreground)]">{line.rawMaterialItem.name}</p>
                    <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                      {line.quantity} {line.rawMaterialItem.unit} × {formatMoney(line.ratePerUnit)}
                    </p>
                    {line.supplier?.name && line.supplier.name !== bill.supplierName ? (
                      <p className="mt-0.5 text-xs text-[var(--color-subtle)]">Supplier: {line.supplier.name}</p>
                    ) : null}
                  </div>
                  <p className="shrink-0 text-sm font-semibold tabular-nums">{formatMoney(line.lineTotal)}</p>
                </li>
              ))}
            </ul>
            <div className="flex justify-between border-t border-[var(--color-border)] bg-[var(--color-surface-muted)]/30 px-4 py-3 text-sm font-semibold">
              <span>Total</span>
              <span className="tabular-nums">{formatMoney(bill.grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-4">
          <SidebarCard title="Supplier" icon={Building2}>
            <p className="text-base font-semibold text-[var(--color-foreground)]">{bill.supplierName}</p>
            {bill.supplierPhone ? (
              <p className="mt-2 text-sm text-[var(--color-muted)]">{bill.supplierPhone}</p>
            ) : null}
            {bill.supplierAddress ? (
              <p className="mt-1 text-sm leading-relaxed text-[var(--color-muted)]">{bill.supplierAddress}</p>
            ) : null}
            <p className="mt-3 text-[11px] text-[var(--color-subtle)] leading-relaxed">
              Snapshot at purchase time — edits to the supplier profile won&apos;t change this bill.
            </p>
          </SidebarCard>

          <SidebarCard title="Bill details" icon={FileText}>
            <div className="space-y-4">
              <MetaRow label="Purchase date" value={formatDateOnly(bill.purchaseDate)} icon={CalendarClock} />
              <MetaRow
                label="Due date"
                value={bill.dueDate ? formatDateOnly(bill.dueDate) : "—"}
                icon={CalendarClock}
              />
              {bill.lastPaymentDate ? (
                <MetaRow
                  label="Last payment"
                  value={formatDateOnly(bill.lastPaymentDate)}
                  icon={CalendarClock}
                />
              ) : null}
              <MetaRow label="Recorded" value={formatDateTime(bill.createdAt)} icon={Hash} />
              {bill.createdByName ? (
                <MetaRow label="Created by" value={bill.createdByName} icon={Hash} />
              ) : null}
            </div>
          </SidebarCard>

          <SidebarCard title="Notes" icon={StickyNote}>
            <textarea
              value={notesEdit}
              onChange={(e) => onNotesChange(e.target.value)}
              rows={4}
              placeholder="Internal notes about this bill…"
              className={cn(
                "w-full resize-y rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm",
                "placeholder:text-[var(--color-subtle)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-primary)]",
              )}
            />
            <Button
              type="button"
              size="sm"
              className="mt-3 w-full"
              onClick={onSaveNotes}
              loading={savingNotes}
            >
              Save notes
            </Button>
          </SidebarCard>
        </aside>
      </div>
      <div className="mt-4 flex gap-2 md:hidden">
        <Button
          type="button"
          size="sm"
          variant={mobileTab === "payments" ? "soft" : "secondary"}
          className="flex-1"
          onClick={() => setMobileTab("payments")}
        >
          Payment history
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mobileTab === "items" ? "soft" : "secondary"}
          className="flex-1"
          onClick={() => setMobileTab("items")}
        >
          Line items
        </Button>
      </div>
      {!isClosed ? (
        <div className="sticky bottom-0 mt-4 border-t border-[var(--color-border)] bg-[var(--color-surface)]/95 p-3 backdrop-blur md:hidden">
          <Button type="button" className="w-full" loading={paymentForm.saving} onClick={paymentForm.onSubmit}>
            Record payment
          </Button>
        </div>
      ) : null}
    </div>
  );
}

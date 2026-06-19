"use client";

import Link from "next/link";
import { Fragment, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  CircleCheckBig,
  HandCoins,
  History,
  Mail,
  MapPin,
  Phone,
  Printer,
  Receipt,
  User,
} from "lucide-react";
import {
  SaleBillStatusBadge,
  SalePaymentStatusBadge,
} from "@/src/components/sales/ar-status-badges";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Field } from "@/src/components/ui/field";
import { Input } from "@/src/components/ui/input";
import { Select } from "@/src/components/ui/select";
import {
  ResponsiveTable,
  tableCenterCellClass,
  tableCenterColumnClass,
} from "@/src/components/ui/table";
import type {
  CustomerReceivableDetail,
  FifoAllocationPreview,
  SalePaymentMethod,
} from "@/src/lib/ar-types";
import {
  RECEIVABLE_PAYMENT_METHOD_OPTIONS,
  formatPaymentMethodWithBankDetail,
} from "@/src/lib/ar-display";
import { cn } from "@/src/lib/cn";
import { formatDateOnly, formatDateTime, formatMoney } from "@/src/lib/format-display";
import { parseMoneyInput } from "@/src/lib/money-input";

export type ReceivableBankAccountOption = {
  id: string;
  bankName: string;
  accountNumber: string;
  label: string;
};

type Props = {
  detail: CustomerReceivableDetail;
  insights?: {
    totalVisits: number;
    averageBillAmount: string;
    lastPurchaseDate: string | null;
    mostPurchasedItems: Array<{ name: string; totalQuantity: string }>;
  } | null;
  amountStr: string;
  onAmountStrChange: (v: string) => void;
  paymentMethod: SalePaymentMethod;
  onPaymentMethodChange: (m: SalePaymentMethod) => void;
  bankAccountId: string;
  onBankAccountIdChange: (v: string) => void;
  bankAccounts: ReceivableBankAccountOption[];
  remarks: string;
  onRemarksChange: (v: string) => void;
  preview: FifoAllocationPreview | null;
  previewLoading: boolean;
  saving: boolean;
  isPrinting?: boolean;
  autoPrintReceipt?: boolean;
  onAutoPrintReceiptChange?: () => void;
  onSubmit: () => void;
  onPrintPayment?: (paymentId: string, kind: CustomerReceivableDetail["paymentHistory"][number]["kind"]) => void;
  printingPaymentId?: string | null;
};

function formatOrderedItemQty(value: number) {
  if (!Number.isFinite(value)) return "0";
  const rounded = Math.round(value * 1000) / 1000;
  if (Math.abs(rounded - Math.round(rounded)) < 0.001) {
    return String(Math.round(rounded));
  }
  return rounded.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function aggregateOrderedItems(
  purchaseHistory: CustomerReceivableDetail["purchaseHistory"],
) {
  const totals = new Map<string, number>();

  for (const bill of purchaseHistory) {
    for (const line of bill.lines) {
      const qty = Number(line.quantity);
      if (!Number.isFinite(qty) || qty <= 0) continue;
      totals.set(line.name, (totals.get(line.name) ?? 0) + qty);
    }
  }

  return [...totals.entries()]
    .map(([name, totalQuantity]) => ({ name, totalQuantity }))
    .sort((a, b) => b.totalQuantity - a.totalQuantity || a.name.localeCompare(b.name));
}

export function CustomerReceivableDetailView({
  detail,
  insights,
  amountStr,
  onAmountStrChange,
  paymentMethod,
  onPaymentMethodChange,
  bankAccountId,
  onBankAccountIdChange,
  bankAccounts,
  remarks,
  onRemarksChange,
  preview,
  previewLoading,
  saving,
  isPrinting = false,
  autoPrintReceipt = false,
  onAutoPrintReceiptChange,
  onSubmit,
  onPrintPayment,
  printingPaymentId,
}: Props) {
  const { customer, purchaseHistory, paymentHistory } = detail;
  const outstanding = Number(customer.outstandingAmount);
  const [expandedBill, setExpandedBill] = useState<string | null>(null);

  const orderedItems = useMemo(
    () => aggregateOrderedItems(purchaseHistory),
    [purchaseHistory],
  );

  const insightStats = useMemo(() => {
    if (insights) {
      return {
        totalVisits: insights.totalVisits,
        averageBillAmount: insights.averageBillAmount,
        lastPurchaseDate: insights.lastPurchaseDate,
      };
    }
    if (purchaseHistory.length === 0) return null;
    const total = purchaseHistory.reduce(
      (sum, bill) => sum + Number(bill.grandTotal || 0),
      0,
    );
    return {
      totalVisits: purchaseHistory.length,
      averageBillAmount: String(total / purchaseHistory.length),
      lastPurchaseDate: purchaseHistory[0]?.saleAt ?? null,
    };
  }, [insights, purchaseHistory]);

  useEffect(() => {
    if (paymentMethod === "CHEQUE") {
      onPaymentMethodChange("CASH");
    }
  }, [paymentMethod, onPaymentMethodChange]);

  const parsed = parseMoneyInput(amountStr);
  const paymentAmount = parsed.invalid ? 0 : parsed.amount;
  const appliedAmount = Math.min(paymentAmount, outstanding);
  const changeAmount =
    paymentAmount > outstanding
      ? Math.max(0, Math.round((paymentAmount - outstanding) * 100) / 100)
      : 0;
  const postPaymentOutstanding = Math.max(0, outstanding - appliedAmount);
  const canPay =
    outstanding > 0.005 &&
    !parsed.invalid &&
    parsed.amount > 0 &&
    appliedAmount > 0.005 &&
    (paymentMethod !== "BANK_TRANSFER" ||
      (bankAccountId.trim().length > 0 && bankAccounts.length > 0));
  const mobilePresetAmounts = [
    Math.min(outstanding, 500),
    Math.min(outstanding, 1000),
    outstanding,
  ].filter((v, i, arr) => v > 0 && arr.indexOf(v) === i);

  return (
    <div className="page-shell page-content space-y-6 pb-24 lg:pb-10">
      <nav className="flex items-center gap-2 text-sm text-muted">
        <Link
          href="/customer-receivables"
          className="inline-flex items-center gap-1 hover:text-[var(--color-primary)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Customer receivables
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-medium text-foreground">{customer.name}</span>
      </nav>

      <Card className="border-[var(--color-border)] p-4 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-3 min-w-0">
            <div className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
              <User className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold">{customer.name}</h1>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span className="font-mono tabular-nums">{customer.phoneNumber}</span>
                </span>
                {customer.address?.trim() ? (
                  <span className="inline-flex min-w-0 max-w-full items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    <span className="truncate">{customer.address.trim()}</span>
                  </span>
                ) : null}
                {customer.email?.trim() ? (
                  <span className="inline-flex min-w-0 max-w-full items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    <span className="truncate">{customer.email.trim()}</span>
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-cream-50)] px-4 py-3 text-right">
            <p className="text-[11px] uppercase tracking-wide text-muted">Outstanding amount</p>
            <p className="font-mono text-2xl font-bold tabular-nums tone-warning-text leading-tight">
              {formatMoney(customer.outstandingAmount)}
            </p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Total purchases" value={formatMoney(customer.totalPurchases)} />
          <Stat label="Total paid" value={formatMoney(customer.totalPaid)} />
          <Stat label="Open bills" value={String(customer.creditBillsCount)} />
          <Stat
            label="Last visit"
            value={customer.lastVisitAt ? formatDateOnly(customer.lastVisitAt) : "—"}
          />
        </div>
      </Card>

      {(insightStats || orderedItems.length > 0) ? (
        <Card density="compact" className="p-4 border-[var(--color-border)]">
          <h2 className="mb-3 text-sm font-semibold">Customer insights</h2>
          {insightStats ? (
            <div className="form-grid form-grid-cols-3">
              <Stat label="Total visits" value={String(insightStats.totalVisits)} />
              <Stat label="Avg bill" value={formatMoney(insightStats.averageBillAmount)} />
              <Stat
                label="Last purchase"
                value={
                  insightStats.lastPurchaseDate
                    ? formatDateOnly(insightStats.lastPurchaseDate)
                    : "—"
                }
              />
            </div>
          ) : null}
          {orderedItems.length > 0 ? (
            <div className={cn(insightStats ? "mt-4 border-t border-[var(--color-border)] pt-3" : "")}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Items ordered
                </p>
                <span className="rounded-full bg-[var(--color-surface-muted)] px-2 py-0.5 text-[11px] font-medium text-muted">
                  {orderedItems.length} {orderedItems.length === 1 ? "item" : "items"}
                </span>
              </div>
              <div className="max-h-44 overflow-y-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)]/30">
                <ul className="divide-y divide-[var(--color-border)]">
                  {orderedItems.map((item) => (
                    <li
                      key={item.name}
                      className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                    >
                      <span className="min-w-0 truncate font-medium text-foreground" title={item.name}>
                        {item.name}
                      </span>
                      <span className="shrink-0 font-mono text-xs tabular-nums text-muted">
                        × {formatOrderedItemQty(item.totalQuantity)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="form-body">
          <section className="form-fields">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Receipt className="h-4 w-4" />
              Purchase history
            </h2>
            {purchaseHistory.length === 0 ? (
              <Card className="p-6 text-sm text-muted border-[var(--color-border)]">
                No purchase history found for this customer yet.
              </Card>
            ) : (
              <ResponsiveTable
                headers={[
                  "Bill",
                  "Date",
                  { label: "Total", thClassName: tableCenterColumnClass },
                  { label: "Paid", thClassName: tableCenterColumnClass },
                  { label: "Due", thClassName: tableCenterColumnClass },
                  "Status",
                  "",
                ]}
              >
                {purchaseHistory.map((bill) => {
                  const dueAmount = Number(bill.remainingAmount);
                  const hasDue = Number.isFinite(dueAmount) && dueAmount > 0.005;

                  return (
                  <Fragment key={bill.id}>
                    <tr>
                      <td className="font-mono text-sm">{bill.receiptNo}</td>
                      <td>{formatDateTime(bill.saleAt)}</td>
                      <td className={cn(tableCenterCellClass, "font-mono tabular-nums")}>
                        {formatMoney(bill.grandTotal)}
                      </td>
                      <td className={cn(tableCenterCellClass, "font-mono tabular-nums")}>
                        {formatMoney(bill.paidAmount)}
                      </td>
                      <td className={cn(tableCenterCellClass, "font-mono tabular-nums text-sm")}>
                        {hasDue ? (
                          <span className="font-semibold tone-warning-text">
                            {formatMoney(bill.remainingAmount)}
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          <SalePaymentStatusBadge status={bill.paymentStatus} />
                          <SaleBillStatusBadge status={bill.billStatus} />
                        </div>
                      </td>
                      <td>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setExpandedBill(expandedBill === bill.id ? null : bill.id)
                          }
                        >
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 transition-transform",
                              expandedBill === bill.id && "rotate-180",
                            )}
                          />
                        </Button>
                      </td>
                    </tr>
                    {expandedBill === bill.id ? (
                      <tr>
                        <td colSpan={7} className="bg-[var(--color-cream-50)]/80">
                          <ul className="space-y-1 py-2 text-sm">
                            {bill.lines.map((line, i) => (
                              <li key={i} className="flex justify-between gap-4">
                                <span>
                                  {line.name} × {line.quantity}
                                </span>
                                <span className="font-mono tabular-nums">
                                  {formatMoney(line.lineTotal)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                  );
                })}
              </ResponsiveTable>
            )}
          </section>

          <section className="form-fields">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <History className="h-4 w-4" />
              Payment history
            </h2>
            {paymentHistory.length === 0 ? (
              <Card className="p-6 text-sm text-muted border-[var(--color-border)]">
                No payments recorded yet.
              </Card>
            ) : (
              <ul className="space-y-2">
                {paymentHistory.map((p) => (
                  <li
                    key={p.id}
                    className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono font-medium">{p.receiptNo}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold tabular-nums">
                          {formatMoney(p.amount)}
                        </span>
                        {p.kind === "CRP" &&
                        p.changeAmount &&
                        Number(p.changeAmount) > 0.005 ? (
                          <span className="rounded-md bg-sky-100 px-2 py-0.5 text-[11px] font-medium text-sky-800 dark:bg-sky-950/50 dark:text-sky-300">
                            Change {formatMoney(p.changeAmount)}
                          </span>
                        ) : null}
                        {onPrintPayment ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            className="h-8 gap-1.5 px-2.5"
                            disabled={printingPaymentId === p.id}
                            onClick={() => onPrintPayment(p.id, p.kind)}
                          >
                            <Printer className="h-3.5 w-3.5" aria-hidden />
                            Print
                          </Button>
                        ) : null}
                      </div>
                    </div>
                    <p className="text-xs text-muted">
                      {formatDateTime(p.paidAt)} ·{" "}
                      {formatPaymentMethodWithBankDetail(p)}
                      {p.kind === "CRP" ? " · FIFO settlement" : ""}
                      {p.kind === "CRP" &&
                      p.amountReceived &&
                      p.changeAmount &&
                      Number(p.changeAmount) > 0.005
                        ? ` · Received ${formatMoney(p.amountReceived)}`
                        : ""}
                    </p>
                    {p.allocations && p.allocations.length > 0 ? (
                      <ul className="mt-2 space-y-0.5 border-t border-[var(--color-border)] pt-2 text-xs text-muted">
                        {p.allocations.map((a, i) => (
                          <li key={i}>
                            {a.receiptNo}: {formatMoney(a.amount)}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {p.kind === "CRP" ? (
                      <p className="mt-2 border-t border-[var(--color-border)] pt-2 text-xs">
                        <span className="text-muted">Amount remaining: </span>
                        <span className="font-mono font-semibold tabular-nums tone-warning-text">
                          {formatMoney(p.remainingOutstanding ?? 0)}
                        </span>
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {outstanding > 0.005 ? (
          <section
            id="receivable-payment-panel"
            className="order-first h-fit rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)] xl:order-none xl:sticky xl:top-4"
          >
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
              <HandCoins className="h-4 w-4" />
              Collect payment (FIFO)
            </h2>

            <div className="mb-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-cream-50)] px-3 py-2.5">
              <p className="text-xs uppercase tracking-wide text-muted">Outstanding now</p>
              <p className="font-mono text-xl font-bold tabular-nums tone-warning-text">
                {formatMoney(customer.outstandingAmount)}
              </p>
              {paymentAmount > 0 && !parsed.invalid ? (
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
                  <div>
                    <p className="text-muted">Applied</p>
                    <p className="font-mono font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                      {formatMoney(appliedAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted">After payment</p>
                    <p className="font-mono font-semibold tabular-nums text-foreground">
                      {formatMoney(postPaymentOutstanding)}
                    </p>
                  </div>
                  {changeAmount > 0.005 ? (
                    <div className="col-span-2 sm:col-span-1">
                      <p className="text-muted">Change</p>
                      <p className="font-mono font-semibold tabular-nums text-sky-700 dark:text-sky-300">
                        {formatMoney(changeAmount)}
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="form-fields">
              <Field id="crp-payment-amount" label="Amount received" required>
                <Input
                  value={amountStr}
                  onChange={(e) => onAmountStrChange(e.target.value)}
                  inputMode="decimal"
                  placeholder="Cash handed by customer"
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
                    onClick={() => onAmountStrChange(String(amt))}
                  >
                    {amt === outstanding ? "Settle full" : formatMoney(amt)}
                  </Button>
                ))}
              </div>

              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-cream-50)]/50 p-3">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
                  Allocation preview
                </p>
                {previewLoading ? (
                  <p className="text-sm text-muted">Calculating…</p>
                ) : preview && preview.allocations.length > 0 ? (
                  <ul className="space-y-1.5">
                    {preview.allocations.map((a) => (
                      <li
                        key={a.saleId}
                        className="flex items-center justify-between text-sm font-mono tabular-nums"
                      >
                        <span>{a.receiptNo}</span>
                        <span>{formatMoney(a.amount)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted">Enter an amount to preview allocation.</p>
                )}
              </div>

              <Field id="crp-payment-method" label="Payment method" required>
                <Select
                  searchable={false}
                  value={paymentMethod}
                  onChange={(e) =>
                    onPaymentMethodChange(e.target.value as SalePaymentMethod)
                  }
                >
                  {RECEIVABLE_PAYMENT_METHOD_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </Field>
              {paymentMethod === "BANK_TRANSFER" ? (
                <Field
                  id="crp-bank-account"
                  label="Bank account"
                  required
                  hint="Records a deposit in bank transactions for this payment"
                >
                  {bankAccounts.length === 0 ? (
                    <p className="text-sm text-muted">
                      No active bank accounts.{" "}
                      <Link
                        href="/banks"
                        className="font-medium text-[var(--color-primary)] hover:underline"
                      >
                        Add a bank account
                      </Link>
                    </p>
                  ) : (
                    <Select
                      searchable
                      value={bankAccountId}
                      onChange={(e) => onBankAccountIdChange(e.target.value)}
                    >
                      <option value="">Choose account</option>
                      {bankAccounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.label}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>
              ) : null}
              <Field id="crp-payment-remarks" label="Remarks">
                <Input value={remarks} onChange={(e) => onRemarksChange(e.target.value)} />
              </Field>

              {canPay && changeAmount > 0.005 ? (
                <div className="rounded-xl border border-sky-200 bg-sky-50/80 px-3 py-2.5 dark:border-sky-900/50 dark:bg-sky-950/30">
                  <p className="text-xs font-semibold uppercase tracking-wide text-sky-800 dark:text-sky-300">
                    Change to return
                  </p>
                  <p className="mt-0.5 font-mono text-xl font-bold tabular-nums text-sky-700 dark:text-sky-300">
                    {formatMoney(changeAmount)}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Received {formatMoney(paymentAmount)} · Applied {formatMoney(appliedAmount)}
                  </p>
                </div>
              ) : null}

              <label className="flex cursor-pointer items-start gap-2 text-[10px] text-muted">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={autoPrintReceipt}
                  onChange={() => onAutoPrintReceiptChange?.()}
                />
                <span>
                  Auto-print receipt after payment. Use an 80mm thermal printer and disable
                  headers/footers in the print dialog.
                </span>
              </label>

              <Button
                type="button"
                className="w-full"
                disabled={!canPay || saving || isPrinting}
                onClick={onSubmit}
              >
                {saving ? "Recording…" : isPrinting ? "Printing…" : "Confirm payment"}
              </Button>
              {canPay ? (
                <p className="flex items-center gap-1 text-xs text-muted">
                  <CircleCheckBig className="h-3.5 w-3.5 text-emerald-600" />
                  {changeAmount > 0.005
                    ? `${formatMoney(appliedAmount)} will settle bills · return ${formatMoney(changeAmount)} change`
                    : "Payment will settle oldest unpaid bills first."}
                </p>
              ) : null}
            </div>
          </section>
        ) : null}
      </div>

      {outstanding > 0.005 ? (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--color-border)] bg-[var(--color-surface)]/95 px-4 py-3 backdrop-blur safe-bottom xl:hidden">
          <div className="mx-auto flex max-w-[900px] items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wide text-muted">Outstanding</p>
              <p className="font-mono text-base font-semibold tabular-nums tone-warning-text">
                {formatMoney(customer.outstandingAmount)}
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              className="h-10 px-4"
              onClick={() =>
                document
                  .getElementById("receivable-payment-panel")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" })
              }
            >
              Collect payment
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

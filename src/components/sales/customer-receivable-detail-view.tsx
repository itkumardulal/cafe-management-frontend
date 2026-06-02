"use client";

import {
  AlertTriangle,
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  FileText,
  Hash,
  Phone,
  Receipt,
  ShoppingBag,
  User,
  UtensilsCrossed,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  RecordSalePaymentSection,
  type SalePaymentMode,
} from "@/src/components/sales/record-sale-payment-section";
import { SaleBillStatusBadge, SalePaymentStatusBadge } from "@/src/components/sales/ar-status-badges";
import type { PosSaleReceiptData } from "@/src/components/sales/pos-sale-receipt";
import { Badge } from "@/src/components/ui/badge";
import { cn } from "@/src/lib/cn";
import type { SalePaymentMethod } from "@/src/lib/ar-types";
import { formatSalePaymentMethod } from "@/src/lib/ar-display";
import { formatDateOnly, formatDateTime, formatMoney } from "@/src/lib/format-display";

type PaymentFormProps = {
  payMode: SalePaymentMode;
  onPayModeChange: (m: SalePaymentMode) => void;
  amountStr: string;
  onAmountStrChange: (v: string) => void;
  paymentMethod: SalePaymentMethod;
  onPaymentMethodChange: (m: SalePaymentMethod) => void;
  referenceNumber: string;
  onReferenceNumberChange: (v: string) => void;
  chequeBankName: string;
  onChequeBankNameChange: (v: string) => void;
  remarks: string;
  onRemarksChange: (v: string) => void;
  saving: boolean;
  onSubmit: () => void;
};

type Props = {
  sale: PosSaleReceiptData;
  paymentForm: PaymentFormProps;
};

function serviceLabel(type: PosSaleReceiptData["serviceType"]) {
  return type === "DELIVERY" ? "Delivery" : "Dine in";
}

function MetaRow({ icon: Icon, label, value }: { icon: typeof Hash; label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface-muted)] text-[var(--color-muted)]">
        <Icon className="size-4" strokeWidth={1.75} aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-subtle)]">{label}</p>
        <p className="break-words text-sm font-medium text-[var(--color-foreground)]">{value}</p>
      </div>
    </div>
  );
}

function SidebarCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof User;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]">
      <div className="flex items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]/50 px-4 py-3">
        <Icon className="size-4 text-[var(--color-muted)]" strokeWidth={1.75} aria-hidden />
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export function CustomerReceivableDetailView({ sale, paymentForm }: Props) {
  const total = Number(sale.grandTotal);
  const paid = Number(sale.paidAmount ?? 0);
  const remaining = Number(sale.remainingAmount ?? sale.creditAmount ?? 0);
  const paidPercent = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
  const isClosed = remaining < 0.005;
  const isOverdue = sale.billStatus === "OVERDUE";
  const otherCharge = Number(sale.otherChargeAmount);
  const discount = Number(sale.discountAmount);
  const payments = sale.payments ?? [];
  const customerTitle =
    sale.customerName?.trim() ||
    sale.customerPhone?.trim() ||
    "Walk-in customer";

  return (
    <div className="page-shell page-content pb-10">
      <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1.5 text-sm">
        <Link
          href="/customer-receivables"
          className="inline-flex items-center gap-1 text-[var(--color-muted)] transition-colors hover:text-[var(--color-primary)]"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Customer receivables
        </Link>
        <ChevronRight className="size-3.5 text-[var(--color-subtle)]" aria-hidden />
        <span className="font-medium text-[var(--color-foreground)]">{sale.receiptNo}</span>
      </nav>

      <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]">
        <div className="border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]/40 px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-subtle)]">
                POS sale · Credit
              </p>
              <h1 className="mt-0.5 text-2xl font-semibold tracking-tight text-[var(--color-foreground)] sm:text-3xl">
                {sale.receiptNo}
              </h1>
              <p className="mt-1 text-sm text-[var(--color-muted)]">{customerTitle}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <SalePaymentStatusBadge status={sale.paymentStatus} />
                <SaleBillStatusBadge status={sale.billStatus} />
                <Badge variant="default" size="sm">
                  {serviceLabel(sale.serviceType)}
                </Badge>
                {sale.serviceType === "DINE_IN" && sale.tableName ? (
                  <Badge variant="default" size="sm">
                    Table {sale.tableName}
                  </Badge>
                ) : null}
              </div>
            </div>
            <div className="shrink-0 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-right">
              <p className="text-[10px] uppercase tracking-wider text-[var(--color-subtle)]">Sale date</p>
              <p className="text-sm font-medium">{formatDateTime(sale.saleAt)}</p>
            </div>
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
                  Collected {formatMoney(paid)} of {formatMoney(total)}
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
              <dt className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-subtle)]">
                Invoice total
              </dt>
              <dd className="font-semibold tabular-nums">{formatMoney(total)}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-subtle)]">
                Collected
              </dt>
              <dd className="font-semibold tabular-nums text-[var(--color-success)]">{formatMoney(paid)}</dd>
            </div>
          </dl>
        </div>

        {isOverdue && !isClosed ? (
          <div className="flex items-start gap-3 border-t border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5 px-4 py-3 sm:px-6">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[var(--color-danger)]" aria-hidden />
            <p className="text-sm text-[var(--color-foreground)]">
              This receivable is <span className="font-semibold">overdue</span>
              {sale.dueDate ? ` (due ${formatDateOnly(sale.dueDate)})` : ""}. Record a payment to reduce the balance.
            </p>
          </div>
        ) : null}

        {isClosed ? (
          <div className="flex items-center gap-3 border-t border-[var(--color-success)]/20 bg-[var(--color-success)]/5 px-4 py-4 sm:px-6">
            <CheckCircle2 className="size-5 shrink-0 text-[var(--color-success)]" aria-hidden />
            <div>
              <p className="text-sm font-medium text-[var(--color-foreground)]">Fully collected</p>
              <p className="text-xs text-[var(--color-muted)]">
                {sale.lastPaymentDate
                  ? `Last payment on ${formatDateOnly(sale.lastPaymentDate)}`
                  : "No further payment required"}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3 lg:items-start">
        <div className="space-y-6 lg:col-span-2">
          {!isClosed && sale.id ? (
            <RecordSalePaymentSection
              className="border-t-0 pt-0"
              remainingBalance={remaining}
              mode={paymentForm.payMode}
              onModeChange={paymentForm.onPayModeChange}
              amountStr={paymentForm.amountStr}
              onAmountStrChange={paymentForm.onAmountStrChange}
              paymentMethod={paymentForm.paymentMethod}
              onPaymentMethodChange={paymentForm.onPaymentMethodChange}
              referenceNumber={paymentForm.referenceNumber}
              onReferenceNumberChange={paymentForm.onReferenceNumberChange}
              chequeBankName={paymentForm.chequeBankName}
              onChequeBankNameChange={paymentForm.onChequeBankNameChange}
              remarks={paymentForm.remarks}
              onRemarksChange={paymentForm.onRemarksChange}
              saving={paymentForm.saving}
              onSubmit={paymentForm.onSubmit}
            />
          ) : null}

          <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]">
            <div className="flex items-center justify-between gap-2 border-b border-[var(--color-border)] px-4 py-3 sm:px-5">
              <h2 className="text-sm font-semibold text-[var(--color-foreground)]">Payment history</h2>
              <span className="rounded-full bg-[var(--color-surface-muted)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-muted)]">
                {payments.length} {payments.length === 1 ? "payment" : "payments"}
              </span>
            </div>

            {payments.length === 0 ? (
              <div className="px-4 py-12 text-center sm:px-5">
                <Receipt className="mx-auto size-8 text-[var(--color-subtle)]" aria-hidden />
                <p className="mt-3 text-sm font-medium text-[var(--color-foreground)]">No payments yet</p>
                <p className="mt-1 text-xs text-[var(--color-muted)]">
                  Payments you record will appear here with receipt numbers.
                </p>
              </div>
            ) : (
              <>
                <ul className="divide-y divide-[var(--color-border)] md:hidden">
                  {payments.map((p) => (
                    <li key={p.id} className="px-4 py-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold tabular-nums">{p.receiptNo}</p>
                          <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                            {formatDateOnly(p.paymentDate)} · {formatSalePaymentMethod(p.paymentMethod)}
                          </p>
                        </div>
                        <p className="text-sm font-semibold tabular-nums text-[var(--color-success)]">
                          {formatMoney(p.amount)}
                        </p>
                      </div>
                      {(p.referenceNumber || p.chequeBankName || p.remarks) && (
                        <p className="mt-2 text-xs leading-relaxed text-[var(--color-muted)]">
                          {[p.chequeBankName, p.referenceNumber, p.remarks].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[32rem] text-left text-sm">
                    <thead>
                      <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]/40 text-xs uppercase tracking-wide text-[var(--color-muted)]">
                        <th className="px-4 py-2.5 font-medium">Receipt</th>
                        <th className="px-4 py-2.5 font-medium">Date</th>
                        <th className="px-4 py-2.5 font-medium text-right">Amount</th>
                        <th className="px-4 py-2.5 font-medium">Method</th>
                        <th className="px-4 py-2.5 font-medium">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((p) => (
                        <tr
                          key={p.id}
                          className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-muted)]/50"
                        >
                          <td className="px-4 py-3 font-medium tabular-nums">{p.receiptNo}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-[var(--color-muted)]">
                            {formatDateOnly(p.paymentDate)}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold tabular-nums text-[var(--color-success)]">
                            {formatMoney(p.amount)}
                          </td>
                          <td className="px-4 py-3">{formatSalePaymentMethod(p.paymentMethod)}</td>
                          <td
                            className="max-w-[14rem] truncate px-4 py-3 text-[var(--color-muted)]"
                            title={[p.chequeBankName, p.referenceNumber, p.remarks].filter(Boolean).join(" · ") || undefined}
                          >
                            {[p.chequeBankName, p.referenceNumber, p.remarks].filter(Boolean).join(" · ") || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]">
            <div className="flex items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]/50 px-4 py-3">
              <ShoppingBag className="size-4 text-[var(--color-muted)]" aria-hidden />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                Line items ({sale.lines.length})
              </h2>
            </div>
            <ul className="divide-y divide-[var(--color-border)]">
              {sale.lines.map((line) => (
                <li key={line.id} className="flex items-start justify-between gap-4 px-4 py-3.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--color-foreground)]">{line.menuItemName}</p>
                    <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                      {formatMoney(line.quantity)} × {formatMoney(line.unitPrice)}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold tabular-nums">{formatMoney(line.lineTotal)}</p>
                </li>
              ))}
            </ul>
            <div className="space-y-2 border-t border-[var(--color-border)] bg-[var(--color-surface-muted)]/30 px-4 py-3 text-sm">
              <div className="flex justify-between gap-2 text-[var(--color-muted)]">
                <span>Subtotal</span>
                <span className="tabular-nums">{formatMoney(sale.subtotal)}</span>
              </div>
              {otherCharge > 0 ? (
                <div className="flex justify-between gap-2 text-[var(--color-muted)]">
                  <span>Extra charges</span>
                  <span className="tabular-nums">{formatMoney(sale.otherChargeAmount)}</span>
                </div>
              ) : null}
              {discount > 0 ? (
                <div className="flex justify-between gap-2 text-[var(--color-muted)]">
                  <span>Discount</span>
                  <span className="tabular-nums">−{formatMoney(sale.discountAmount)}</span>
                </div>
              ) : null}
              <div className="flex justify-between gap-2 border-t border-[var(--color-border)] pt-2 font-semibold text-[var(--color-foreground)]">
                <span>Grand total</span>
                <span className="tabular-nums text-[var(--color-primary)]">{formatMoney(sale.grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-4">
          <SidebarCard title="Customer" icon={User}>
            {sale.customerName ? (
              <p className="text-base font-semibold text-[var(--color-foreground)]">{sale.customerName}</p>
            ) : (
              <p className="text-sm text-[var(--color-muted)]">No name on file</p>
            )}
            {sale.customerPhone ? (
              <p className="mt-2 flex items-center gap-2 text-sm text-[var(--color-muted)]">
                <Phone className="size-3.5 shrink-0" aria-hidden />
                {sale.customerPhone}
              </p>
            ) : null}
            {sale.customerAddress ? (
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">{sale.customerAddress}</p>
            ) : null}
            {!sale.customerName && !sale.customerPhone && !sale.customerAddress ? (
              <p className="text-[11px] leading-relaxed text-[var(--color-subtle)]">
                Customer details were not captured at checkout.
              </p>
            ) : null}
          </SidebarCard>

          <SidebarCard title="Sale details" icon={FileText}>
            <div className="space-y-4">
              <MetaRow label="Service" value={serviceLabel(sale.serviceType)} icon={UtensilsCrossed} />
              {sale.tableName ? (
                <MetaRow label="Table" value={sale.tableName} icon={UtensilsCrossed} />
              ) : null}
              <MetaRow label="Sale date" value={formatDateTime(sale.saleAt)} icon={CalendarClock} />
              <MetaRow
                label="Due date"
                value={sale.dueDate ? formatDateOnly(sale.dueDate) : "—"}
                icon={CalendarClock}
              />
              {sale.lastPaymentDate ? (
                <MetaRow
                  label="Last payment"
                  value={formatDateOnly(sale.lastPaymentDate)}
                  icon={CalendarClock}
                />
              ) : null}
              <MetaRow label="Recorded" value={formatDateTime(sale.createdAt)} icon={Hash} />
              {sale.createdByName ? (
                <MetaRow label="Cashier" value={sale.createdByName} icon={User} />
              ) : null}
            </div>
          </SidebarCard>

          {sale.notes?.trim() ? (
            <SidebarCard title="Notes" icon={FileText}>
              <p className="text-sm leading-relaxed text-[var(--color-foreground)]">{sale.notes.trim()}</p>
            </SidebarCard>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

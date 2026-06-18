"use client";

import Link from "next/link";
import { ArrowRight, HandCoins } from "lucide-react";
import { cn } from "@/src/lib/cn";
import { formatDateOnly, formatMoney } from "@/src/lib/format-display";

type SaleReceivablePaymentCtaProps = {
  customerId: string;
  customerName?: string | null;
  outstandingAmount: number;
  dueDate?: string | null;
  receiptNo?: string;
  className?: string;
  onNavigate?: () => void;
};

export function SaleReceivablePaymentCta({
  customerId,
  customerName,
  outstandingAmount,
  dueDate,
  receiptNo,
  className,
  onNavigate,
}: SaleReceivablePaymentCtaProps) {
  const payHref = `/customer-receivables/${customerId}?pay=1`;

  return (
    <section className={cn("border-t border-[var(--color-border)] pt-6", className)}>
      <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]">
        <div className="border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]/60 px-4 py-4 sm:px-5">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
              <HandCoins className="size-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-foreground">Customer receivables</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                {receiptNo ? (
                  <>
                    Invoice <span className="font-mono font-medium text-foreground">{receiptNo}</span>{" "}
                    is on credit. Collect payment from the customer account — allocations follow FIFO
                    across open bills.
                  </>
                ) : (
                  <>
                    This sale is on credit. Collect payment from the customer account — allocations
                    follow FIFO across open bills.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-cream-50)] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                Outstanding on this bill
              </p>
              <p className="mt-1 font-mono text-2xl font-semibold tabular-nums tone-warning-text">
                {formatMoney(outstandingAmount)}
              </p>
            </div>
            <div className="rounded-xl border border-[var(--color-border)] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Customer</p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {customerName?.trim() || "Linked customer"}
              </p>
              {dueDate ? (
                <p className="mt-1 text-xs text-muted">Due {formatDateOnly(dueDate)}</p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <Link
              href={`/customer-receivables/${customerId}`}
              onClick={onNavigate}
              className="inline-flex h-9 w-full items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm font-medium text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-cream-100)] sm:w-auto"
            >
              View account
            </Link>
            <Link
              href={payHref}
              onClick={onNavigate}
              className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-3 text-sm font-medium text-[var(--color-primary-foreground)] shadow-[var(--shadow-sm)] transition-colors hover:bg-[var(--color-primary-hover)] sm:w-auto"
            >
              Collect payment
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function shouldRouteCreditSaleToReceivables(sale: {
  billingType?: "PAID" | "CREDIT";
  customerId?: string | null;
  remainingAmount?: string;
  creditAmount?: string;
}): boolean {
  if (sale.billingType !== "CREDIT" || !sale.customerId) {
    return false;
  }
  const remaining = Number(sale.remainingAmount ?? sale.creditAmount ?? 0);
  return Number.isFinite(remaining) && remaining > 0.005;
}

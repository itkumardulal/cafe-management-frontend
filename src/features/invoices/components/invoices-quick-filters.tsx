"use client";

import { SlidersHorizontal } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/src/lib/cn";

type ServiceFilter = "" | "DINE_IN" | "DELIVERY";
type BillingFilter = "" | "PAID" | "CREDIT";
type PaymentChannelFilter = "" | "CASH" | "BANK";

function filterPillClass(active: boolean) {
  return cn(
    "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all",
    active
      ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white shadow-sm"
      : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] hover:border-[var(--color-input)] hover:bg-[var(--color-cream-50)] hover:text-[var(--color-foreground)]",
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <span className="w-full text-[10px] font-semibold uppercase tracking-wider text-[var(--color-subtle)] sm:w-auto sm:shrink-0">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

export function InvoicesQuickFilters({
  serviceFilter,
  billingFilter,
  paymentChannelFilter,
  openBalanceFilter,
  onServiceChange,
  onBillingChange,
  onPaymentChannelChange,
  onOpenBalanceToggle,
  className,
}: {
  serviceFilter: ServiceFilter;
  billingFilter: BillingFilter;
  paymentChannelFilter: PaymentChannelFilter;
  openBalanceFilter: boolean;
  onServiceChange: (value: ServiceFilter) => void;
  onBillingChange: (value: BillingFilter) => void;
  onPaymentChannelChange: (value: PaymentChannelFilter) => void;
  onOpenBalanceToggle: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)]/40 p-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 sm:p-3.5",
        className,
      )}
    >
      <div className="flex items-center gap-2 text-[var(--color-muted)]">
        <SlidersHorizontal size={15} strokeWidth={1.75} aria-hidden />
        <span className="text-xs font-medium text-[var(--color-foreground)]">Quick filters</span>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
        <FilterGroup label="Service">
          {(["", "DINE_IN", "DELIVERY"] as const).map((f) => (
            <button
              key={f || "all-service"}
              type="button"
              onClick={() => onServiceChange(f)}
              className={filterPillClass(serviceFilter === f)}
            >
              {f === "" ? "All" : f === "DINE_IN" ? "Dine in" : "Delivery"}
            </button>
          ))}
        </FilterGroup>
        <FilterGroup label="Tender">
          {(["", "CASH", "BANK"] as const).map((f) => (
            <button
              key={f || "all-tender"}
              type="button"
              onClick={() => onPaymentChannelChange(f)}
              className={filterPillClass(paymentChannelFilter === f)}
            >
              {f === "" ? "All" : f === "CASH" ? "Cash" : "Bank"}
            </button>
          ))}
        </FilterGroup>
        <FilterGroup label="Billing">
          {(["", "PAID", "CREDIT"] as const).map((f) => (
            <button
              key={f || "all-billing"}
              type="button"
              onClick={() => onBillingChange(f)}
              className={filterPillClass(billingFilter === f)}
            >
              {f === "" ? "All" : f === "PAID" ? "Paid" : "Credit"}
            </button>
          ))}
          <button
            type="button"
            onClick={onOpenBalanceToggle}
            className={filterPillClass(openBalanceFilter)}
          >
            Open balance
          </button>
        </FilterGroup>
      </div>
    </div>
  );
}

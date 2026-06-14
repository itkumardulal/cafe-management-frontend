"use client";

import { AlertCircle, Coins, FileText, Receipt } from "lucide-react";
import { Card } from "@/src/components/ui/card";
import { cn } from "@/src/lib/cn";
import { formatMoney } from "@/src/lib/format-display";
import type { ReportPeriodParams } from "@/src/features/reports/types/reports.types";

const PERIOD_LABELS: Record<string, string> = {
  today: "Today",
  yesterday: "Yesterday",
  last_7_days: "Last 7 days",
  last_30_days: "Last 30 days",
  this_month: "This month",
  last_month: "Last month",
  custom: "Custom range",
};

function periodSubtitle(params: ReportPeriodParams): string {
  if (params.period === "custom" && params.fromDate && params.toDate) {
    return `${params.fromDate} – ${params.toDate}`;
  }
  return PERIOD_LABELS[params.period ?? "this_month"] ?? "This month";
}

type SummaryItem = {
  title: string;
  value: string;
  subtitle?: string;
  icon: typeof FileText;
  chipClass: string;
};

export function InvoicesSummaryStrip({
  totalRecords,
  pageRevenue,
  pageChangeReturned,
  openBalanceCount,
  periodParams,
  loading,
}: {
  totalRecords: number;
  pageRevenue: number;
  pageChangeReturned: number;
  openBalanceCount: number;
  periodParams: ReportPeriodParams;
  loading?: boolean;
}) {
  const items: SummaryItem[] = [
    {
      title: "Invoices in period",
      value: loading ? "—" : String(totalRecords),
      subtitle: periodSubtitle(periodParams),
      icon: FileText,
      chipClass: "bg-[var(--color-primary)]/10 text-[var(--color-primary)]",
    },
    {
      title: "Page total",
      value: loading ? "—" : formatMoney(String(pageRevenue)),
      subtitle: "Sum of invoices on this page",
      icon: Receipt,
      chipClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    },
    {
      title: "Change returned",
      value: loading ? "—" : formatMoney(String(pageChangeReturned)),
      subtitle:
        pageChangeReturned > 0.005
          ? "Cash returned on this page"
          : "No change on this page",
      icon: Coins,
      chipClass:
        pageChangeReturned > 0.005
          ? "bg-sky-500/10 text-sky-700 dark:text-sky-300"
          : "bg-[var(--color-surface-muted)] text-[var(--color-muted)]",
    },
    {
      title: "Open balance",
      value: loading ? "—" : String(openBalanceCount),
      subtitle: openBalanceCount > 0 ? "Unpaid on this page" : "No dues on this page",
      icon: AlertCircle,
      chipClass:
        openBalanceCount > 0
          ? "bg-[color-mix(in_srgb,var(--color-warning)_12%,var(--color-surface))] tone-warning-text"
          : "bg-[var(--color-surface-muted)] text-[var(--color-muted)]",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.title} density="compact" className="relative overflow-hidden p-3.5 sm:p-4">
          <div className="flex items-start justify-between gap-2">
            <div
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                item.chipClass,
              )}
            >
              <item.icon className="h-4 w-4" aria-hidden />
            </div>
            <span className="inline-flex shrink-0 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              Period
            </span>
          </div>
          <div className="mt-3 space-y-0.5">
            <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-subtle)]">
              {item.title}
            </p>
            <p className="text-xl font-semibold tabular-nums tracking-tight text-foreground">
              {item.value}
            </p>
            {item.subtitle ? (
              <p className="text-xs leading-snug text-[var(--color-muted)]">{item.subtitle}</p>
            ) : null}
          </div>
        </Card>
      ))}
    </div>
  );
}

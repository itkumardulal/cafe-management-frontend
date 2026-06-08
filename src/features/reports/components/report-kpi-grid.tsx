"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  HandCoins,
  ShoppingBag,
  TrendingUp,
  Truck,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { Card } from "@/src/components/ui/card";
import { cn } from "@/src/lib/cn";
import { formatMoney } from "@/src/lib/format-display";
import { reportHref, type ReportPeriodParams, type ReportsSummary } from "@/src/features/reports/types/reports.types";

type KpiTone = "sales" | "profit" | "expense" | "receivable" | "payable" | "alert";

const toneStyles: Record<KpiTone, { icon: LucideIcon; chip: string; ring: string }> = {
  sales: {
    icon: ShoppingBag,
    chip: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    ring: "group-hover:ring-emerald-200/80 dark:group-hover:ring-emerald-900/50",
  },
  profit: {
    icon: TrendingUp,
    chip: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
    ring: "group-hover:ring-sky-200/80 dark:group-hover:ring-sky-900/50",
  },
  expense: {
    icon: Wallet,
    chip: "tone-warning-surface tone-warning-text",
    ring: "group-hover:ring-[color-mix(in_srgb,var(--color-warning)_40%,transparent)]",
  },
  receivable: {
    icon: HandCoins,
    chip: "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
    ring: "group-hover:ring-violet-200/80 dark:group-hover:ring-violet-900/50",
  },
  payable: {
    icon: Truck,
    chip: "bg-orange-50 text-orange-900 dark:bg-orange-950/40 dark:text-orange-300",
    ring: "group-hover:ring-orange-200/80 dark:group-hover:ring-orange-900/50",
  },
  alert: {
    icon: AlertTriangle,
    chip: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
    ring: "group-hover:ring-red-200/80 dark:group-hover:ring-red-900/50",
  },
};

type KpiBadgeKind = "period" | "live" | "action" | "healthy";

const kpiBadgeStyles: Record<KpiBadgeKind, string> = {
  period:
    "border border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-200",
  live:
    "border border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200",
  action:
    "border border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200",
  healthy:
    "border border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200",
};

function KpiBadge({ kind, children }: { kind: KpiBadgeKind; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold leading-none",
        kpiBadgeStyles[kind],
      )}
    >
      {children}
    </span>
  );
}

function SectionBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex shrink-0 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-0.5 text-[11px] font-semibold text-foreground">
      {children}
    </span>
  );
}

function ReportKpiCard({
  title,
  value,
  subtitle,
  badgeKind,
  badgeLabel,
  href,
  tone,
  index,
}: {
  title: string;
  value: string;
  subtitle: string;
  badgeKind: KpiBadgeKind;
  badgeLabel: string;
  href?: string;
  tone: KpiTone;
  index: number;
}) {
  const { icon: Icon, chip, ring } = toneStyles[tone];
  const card = (
    <Card
      density="compact"
      className={cn(
        "group relative overflow-hidden p-3 transition-all duration-200 sm:p-3.5",
        "ring-1 ring-transparent hover:-translate-y-0.5 hover:shadow-md",
        ring,
        href && "cursor-pointer",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", chip)}>
          <Icon className="h-4 w-4" aria-hidden />
        </div>
        <KpiBadge kind={badgeKind}>{badgeLabel}</KpiBadge>
      </div>
      <div className="mt-2 space-y-0.5">
        <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-subtle)]">
          {title}
        </p>
        <p className="text-xl font-semibold tabular-nums tracking-tight text-foreground">{value}</p>
        <p className="text-xs leading-snug text-[var(--color-muted)]">{subtitle}</p>
      </div>
    </Card>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}
    >
      {href ? (
        <Link href={href} className="block">
          {card}
        </Link>
      ) : (
        card
      )}
    </motion.div>
  );
}

function SectionHeader({ title, badge }: { title: string; badge: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      <SectionBadge>{badge}</SectionBadge>
    </div>
  );
}

type ReportKpiGridProps = {
  summary: ReportsSummary;
  periodParams: ReportPeriodParams;
};

export function ReportKpiGrid({ summary, periodParams }: ReportKpiGridProps) {
  const periodLabel = summary.period.label;
  const alertCount = summary.snapshotMetrics.stockAlerts;

  return (
    <div className="space-y-5">
      <div className="space-y-2.5">
        <SectionHeader title="Period performance" badge={periodLabel} />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <ReportKpiCard
            index={0}
            tone="sales"
            title="Total sales"
            value={formatMoney(summary.periodMetrics.totalSales)}
            subtitle="Net revenue after discounts"
            badgeKind="period"
            badgeLabel="Period"
            href={reportHref("/reports/sales", periodParams)}
          />
          <ReportKpiCard
            index={1}
            tone="profit"
            title="Total profit"
            value={formatMoney(summary.periodMetrics.totalProfit)}
            subtitle="Gross profit for selected period"
            badgeKind="period"
            badgeLabel="Period"
            href={reportHref("/reports/profit", periodParams)}
          />
          <ReportKpiCard
            index={2}
            tone="expense"
            title="Total expenses"
            value={formatMoney(summary.periodMetrics.totalExpenses)}
            subtitle="Daily and operating costs"
            badgeKind="period"
            badgeLabel="Period"
            href={reportHref("/reports/expenses", periodParams)}
          />
        </div>
      </div>

      <div className="space-y-2.5">
        <SectionHeader title="Live cafe status" badge="As of today" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <ReportKpiCard
            index={3}
            tone="receivable"
            title="Customer receivables"
            value={formatMoney(summary.snapshotMetrics.outstandingCustomerReceivables)}
            subtitle="Outstanding customer credit"
            badgeKind="live"
            badgeLabel="Live"
            href="/reports/customer-receivables"
          />
          <ReportKpiCard
            index={4}
            tone="payable"
            title="Supplier payables"
            value={formatMoney(summary.snapshotMetrics.outstandingSupplierPayables)}
            subtitle="Unpaid supplier bills"
            badgeKind="live"
            badgeLabel="Live"
            href="/reports/supplier-payables"
          />
          <ReportKpiCard
            index={5}
            tone="alert"
            title="Stock alerts"
            value={String(alertCount)}
            subtitle={`${summary.snapshotMetrics.stockAlertsLow} low · ${summary.snapshotMetrics.stockAlertsOut} out of stock`}
            badgeKind={alertCount > 0 ? "action" : "healthy"}
            badgeLabel={alertCount > 0 ? "Action needed" : "Healthy"}
            href={reportHref("/reports/inventory", periodParams)}
          />
        </div>
      </div>
    </div>
  );
}

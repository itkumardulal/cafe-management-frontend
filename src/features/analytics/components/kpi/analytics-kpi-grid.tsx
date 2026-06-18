"use client";

import {
  AlertTriangle,
  Banknote,
  HandCoins,
  ShoppingBag,
  TrendingUp,
  Truck,
  Wallet,
} from "lucide-react";
import { formatMoney } from "@/src/lib/format-display";
import type { AnalyticsOverview } from "@/src/features/analytics/types/analytics.types";
import { AnalyticsKpiCard } from "@/src/features/analytics/components/kpi/analytics-kpi-card";
import { reportHref, type ReportPeriodParams } from "@/src/features/reports/types/reports.types";
import { useAppSelector } from "@/src/store/hooks";

type KpiCardConfig = {
  title: string;
  value: string;
  subtitle?: string;
  trend?: AnalyticsOverview["kpis"]["totalSales"];
  live?: AnalyticsOverview["kpis"]["customerReceivablesOutstanding"];
  icon: typeof ShoppingBag;
  chip: string;
  href?: string;
};

function KpiCardGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid w-full min-w-0 auto-rows-fr grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 [&>*]:h-full [&>*]:min-w-0">
      {children}
    </div>
  );
}

function SectionHeader({ title, badge }: { title: string; badge: string }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-2">
      <h2 className="min-w-0 truncate text-sm font-semibold text-foreground">{title}</h2>
      <span className="inline-flex shrink-0 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-0.5 text-[11px] font-semibold text-foreground">
        {badge}
      </span>
    </div>
  );
}

export function AnalyticsKpiGrid({
  overview,
  periodParams,
}: {
  overview: AnalyticsOverview;
  periodParams: ReportPeriodParams;
}) {
  const { kpis, visibility } = overview;
  const stockAlerts = useAppSelector((state) => state.dashboard.stockAlerts);

  if (!visibility.financials) {
    return null;
  }

  const periodCards: Array<KpiCardConfig | null> = [
    kpis.totalOrders
      ? {
          title: "Orders volume",
          value: String(kpis.totalOrders.value),
          trend: kpis.totalOrders,
          icon: Wallet,
          chip: "tone-warning-surface tone-warning-text",
          href: reportHref("/reports/sales", periodParams),
        }
      : null,
    kpis.totalSales
      ? {
          title: "Total sales",
          value: formatMoney(String(kpis.totalSales.value)),
          trend: kpis.totalSales,
          icon: ShoppingBag,
          chip: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
          href: reportHref("/reports/sales", periodParams),
        }
      : null,
    kpis.grossProfit
      ? {
          title: "Gross profit",
          value: formatMoney(String(kpis.grossProfit.value)),
          trend: kpis.grossProfit,
          icon: TrendingUp,
          chip: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
          href: reportHref("/reports/profit", periodParams),
        }
      : null,
    kpis.cashAtHand
      ? {
          title: "Cash at hand",
          value: formatMoney(String(kpis.cashAtHand.value)),
          subtitle: "POS cash receipts",
          trend: kpis.cashAtHand,
          icon: HandCoins,
          chip: "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
          href: reportHref("/reports/sales", periodParams),
        }
      : null,
    kpis.cashAtBank
      ? {
          title: "Cash at bank",
          value: formatMoney(String(kpis.cashAtBank.value)),
          subtitle: "POS non-cash receipts",
          trend: kpis.cashAtBank,
          icon: Banknote,
          chip: "bg-teal-50 text-teal-800 dark:bg-teal-950/40 dark:text-teal-200",
          href: reportHref("/reports/sales", periodParams),
        }
      : null,
  ];

  const stockAlertCount = stockAlerts
    ? stockAlerts.counts.low + stockAlerts.counts.out
    : 0;

  const liveCards: Array<KpiCardConfig | null> = [
    kpis.customerReceivablesOutstanding
      ? {
          title: "Customer receivables",
          value: formatMoney(kpis.customerReceivablesOutstanding.value),
          subtitle: "Outstanding balance",
          live: kpis.customerReceivablesOutstanding,
          icon: HandCoins,
          chip: "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
          href: "/customer-receivables?hasOutstanding=true",
        }
      : null,
    kpis.supplierPayablesOutstanding
      ? {
          title: "Supplier payables",
          value: formatMoney(kpis.supplierPayablesOutstanding.value),
          subtitle: "Outstanding balance",
          live: kpis.supplierPayablesOutstanding,
          icon: Truck,
          chip: "bg-orange-50 text-orange-900 dark:bg-orange-950/40 dark:text-orange-300",
          href: "/bill-settlement?hasOutstanding=true",
        }
      : null,
    visibility.inventory
      ? {
          title: "Stock alerts",
          value: String(stockAlertCount),
          subtitle:
            stockAlertCount > 0
              ? `${stockAlerts?.counts.low ?? 0} low, ${stockAlerts?.counts.out ?? 0} out of stock`
              : "All stock levels healthy",
          icon: AlertTriangle,
          chip:
            stockAlertCount > 0
              ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
              : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
          href: stockAlertCount > 0 ? "/inventory?filter=low" : "/inventory",
        }
      : null,
    kpis.bankBalanceSnapshot
      ? {
          title: "Bank Balance",
          value: formatMoney(kpis.bankBalanceSnapshot.value),
          subtitle: `${kpis.bankBalanceSnapshot.activeAccountCount} active accounts (ledger)`,
          live: kpis.bankBalanceSnapshot,
          icon: Banknote,
          chip: "bg-slate-50 text-slate-800 dark:bg-slate-950/40 dark:text-slate-200",
          href: "/banks",
        }
      : null,
  ];

  const renderCards = (cards: Array<KpiCardConfig | null>, startIndex: number) =>
    cards
      .filter((card): card is KpiCardConfig => card !== null)
      .map((card, index) => (
        <AnalyticsKpiCard
          key={card.title}
          title={card.title}
          value={card.value}
          subtitle={card.subtitle}
          trend={card.trend ?? undefined}
          live={card.live ?? undefined}
          icon={card.icon}
          chipClass={card.chip}
          href={card.href}
          index={startIndex + index}
        />
      ));

  return (
    <div className="min-w-0 w-full max-w-full space-y-5">
      <div className="min-w-0 space-y-3">
        <SectionHeader title="Period performance" badge="Period" />
        <KpiCardGrid>{renderCards(periodCards, 0)}</KpiCardGrid>
      </div>
      <div className="min-w-0 space-y-3">
        <SectionHeader title="Live balances" badge="Live" />
        <KpiCardGrid>{renderCards(liveCards, periodCards.filter(Boolean).length)}</KpiCardGrid>
      </div>
    </div>
  );
}

"use client";

import {
  AlertTriangle,
  Banknote,
  HandCoins,
  Percent,
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

function SectionHeader({ title, badge }: { title: string; badge: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
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
    kpis.netProfit
      ? {
          title: "Net profit",
          value: formatMoney(String(kpis.netProfit.value)),
          trend: kpis.netProfit,
          icon: TrendingUp,
          chip: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
          href: reportHref("/reports/profit", periodParams),
        }
      : null,
    kpis.totalOrders
      ? {
          title: "Total orders",
          value: String(kpis.totalOrders.value),
          trend: kpis.totalOrders,
          icon: Wallet,
          chip: "tone-warning-surface tone-warning-text",
          href: reportHref("/reports/sales", periodParams),
        }
      : null,
    kpis.averageOrderValue
      ? {
          title: "Average order value",
          value: formatMoney(String(kpis.averageOrderValue.value)),
          trend: kpis.averageOrderValue,
          icon: TrendingUp,
          chip: "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
          href: reportHref("/reports/sales", periodParams),
        }
      : null,
    kpis.discountImpact
      ? {
          title: "Discount impact",
          value: formatMoney(kpis.discountImpact.value),
          subtitle: kpis.discountImpact.subtitle,
          icon: Percent,
          chip: "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
          href: reportHref("/reports/discounts", periodParams),
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
          title: "Bank & cash balance",
          value: formatMoney(kpis.bankBalanceSnapshot.value),
          subtitle: `${kpis.bankBalanceSnapshot.activeAccountCount} active accounts`,
          live: kpis.bankBalanceSnapshot,
          icon: Banknote,
          chip: "bg-teal-50 text-teal-800 dark:bg-teal-950/40 dark:text-teal-200",
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
    <div className="space-y-5">
      <div className="space-y-3">
        <SectionHeader title="Period performance" badge="Period" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {renderCards(periodCards, 0)}
        </div>
      </div>
      <div className="space-y-3">
        <SectionHeader title="Live balances" badge="Live" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {renderCards(liveCards, periodCards.filter(Boolean).length)}
        </div>
      </div>
    </div>
  );
}

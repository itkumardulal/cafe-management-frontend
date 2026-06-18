import type { ReportPeriodKey, ReportPeriodParams } from "@/src/features/reports/types/reports.types";

export type AnalyticsPeriodParams = ReportPeriodParams;

export type AnalyticsTrend = "up" | "down" | "flat";

export type AnalyticsKpiMetric = {
  value: string | number;
  previousValue: string | number;
  changePercent: string;
  trend: AnalyticsTrend;
};

export type AnalyticsLiveKpi = {
  value: string;
  badge: "live";
};

export type AnalyticsVisibility = {
  financials: boolean;
  inventory: boolean;
  tables: boolean;
};

export type AnalyticsOverview = {
  period: { key: ReportPeriodKey; from: string; to: string; label: string };
  comparisonPeriod: { key: ReportPeriodKey; from: string; to: string; label: string };
  visibility: AnalyticsVisibility;
  generatedAt: string;
  kpis: {
    totalSales: AnalyticsKpiMetric | null;
    grossProfit: AnalyticsKpiMetric | null;
    totalOrders: AnalyticsKpiMetric | null;
    cashAtHand: AnalyticsKpiMetric | null;
    cashAtBank: AnalyticsKpiMetric | null;
    customerReceivablesOutstanding: AnalyticsLiveKpi | null;
    supplierPayablesOutstanding: AnalyticsLiveKpi | null;
    discountImpact: { value: string; subtitle: string } | null;
    bankBalanceSnapshot: (AnalyticsLiveKpi & { activeAccountCount: number }) | null;
  };
  charts: {
    salesTrend?: {
      granularity: "day" | "week" | "month";
      points: Array<{ date: string; totalSales: string; orderCount: number }>;
    };
    profitExpense?: {
      granularity: "day" | "week" | "month";
      buckets: Array<{ date: string; revenue: string; expenses: string; netProfit: string }>;
    };
    topMenuItems?: Array<{
      menuItemId: string;
      name: string;
      quantitySold: string;
      revenue: string;
    }>;
    salesByCategory?: Array<{
      categoryName: string;
      revenue: string;
      quantitySold: string;
      percentOfTotal: string;
    }>;
    paymentMethods?: Array<{
      paymentMethod: string;
      label: string;
      totalAmount: string;
      paymentCount: number;
      percentOfTotal: string;
    }>;
    peakHours?: Array<{
      hour: number;
      label: string;
      orderCount: number;
      totalSales: string;
    }>;
    receivablesAging?: Array<{
      bucket: string;
      label: string;
      outstandingAmount: string;
      customerCount: number;
    }>;
    supplierPayables?: Array<{
      supplierId: string;
      supplierName: string;
      outstandingAmount: string;
      totalPurchases: string;
      totalPaid: string;
      billCount: number;
    }>;
    salesByServiceType?: Array<{
      serviceType: string;
      label: string;
      revenue: string;
      orderCount: number;
      percentOfTotal: string;
    }>;
    expenseByCategory?: Array<{
      category: string;
      label: string;
      amount: string;
      percentOfTotal: string;
    }>;
    tableOccupancy?: Array<{ label: string; value: number }> | null;
  };
  widgets: {
    lowStock: {
      counts: { low: number; out: number };
      items: Array<{
        id: string;
        kind: string;
        name: string;
        quantityOnHand: string;
        reorderLevel: string;
        unit: string | null;
        stockStatus: "Critical" | "Low";
      }>;
    } | null;
    tableStatus: {
      vacant: number;
      occupied: number;
      inBilling: number;
      total: number;
    } | null;
    staffTodaySummary: { totalSales: string; totalOrders: number } | null;
    activityFeed: {
      items: Array<{
        id: string;
        occurredAt: string;
        eventType: string;
        title: string;
        description: string;
        actorName: string | null;
      }>;
      nextCursor: string | null;
    };
  };
};

export type AnalyticsActivityFeed = {
  items: AnalyticsOverview["widgets"]["activityFeed"]["items"];
  nextCursor: string | null;
};

export const ANALYTICS_DEFAULT_PERIOD: ReportPeriodKey = "today";

export function analyticsCacheKey(params: AnalyticsPeriodParams): string {
  const period = params.period ?? ANALYTICS_DEFAULT_PERIOD;
  if (period === "custom") {
    return `custom:${params.fromDate ?? ""}:${params.toDate ?? ""}`;
  }
  return period;
}

export function buildAnalyticsQueryParams(
  params?: AnalyticsPeriodParams,
): Record<string, string | undefined> {
  const period = params?.period ?? ANALYTICS_DEFAULT_PERIOD;
  return {
    period,
    fromDate: period === "custom" ? params?.fromDate : undefined,
    toDate: period === "custom" ? params?.toDate : undefined,
  };
}

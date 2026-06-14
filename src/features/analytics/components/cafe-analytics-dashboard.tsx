"use client";

import { useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { PageHeader } from "@/src/components/shared/page-header";
import { Button } from "@/src/components/ui/button";
import { EmptyState } from "@/src/components/ui/empty-state";
import { ReportPeriodFilter } from "@/src/features/reports/components/report-period-filter";
import { AnalyticsKpiGrid } from "@/src/features/analytics/components/kpi/analytics-kpi-grid";
import { AnalyticsExportMenu } from "@/src/features/analytics/components/analytics-export-menu";
import { AnalyticsQuickActions } from "@/src/features/analytics/components/analytics-quick-actions";
import { AnalyticsDashboardSkeleton } from "@/src/features/analytics/components/skeletons/analytics-dashboard-skeleton";
import {
  ExpenseCategoryChart,
  PaymentMethodsChart,
  PeakHoursChart,
  ProfitExpenseChart,
  ReceivablesAgingChart,
  SalesByCategoryChart,
  SalesTrendChart,
  ServiceTypeChart,
  SupplierPayablesChart,
  TableOccupancyChart,
  TopMenuItemsChart,
} from "@/src/features/analytics/components/charts/analytics-charts";
import {
  ActivityFeedWidget,
  LowStockTable,
  StaffTodaySummary,
  TableStatusCards,
} from "@/src/features/analytics/components/widgets/analytics-widgets";
import { useAnalyticsPeriod } from "@/src/features/analytics/hooks/use-analytics-period";
import { analyticsCacheKey } from "@/src/features/analytics/types/analytics.types";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import {
  fetchAnalyticsOverviewForceThunk,
  fetchAnalyticsOverviewThunk,
} from "@/src/store/slices/analytics.slice";
import { fetchStockAlertsThunk } from "@/src/store/slices/dashboard.slice";
import { canAccessStockAlerts } from "@/src/lib/stock-alerts-access";

export function CafeAnalyticsDashboard() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const menus = useAppSelector((state) => state.menu.items);
  const { periodParams, effectivePeriodParams, setPeriodParams } = useAnalyticsPeriod();
  const { cache, status, error } = useAppSelector((state) => state.analytics);

  const cacheKey = analyticsCacheKey(effectivePeriodParams ?? { period: "this_month" });
  const overview = cache[cacheKey]?.overview;
  const loading = status === "loading" && !overview;

  useEffect(() => {
    if (!effectivePeriodParams) return;
    void dispatch(fetchAnalyticsOverviewThunk(effectivePeriodParams));
    if (canAccessStockAlerts(user?.role, menus)) {
      void dispatch(fetchStockAlertsThunk());
    }
  }, [dispatch, effectivePeriodParams, menus, user?.role]);

  const handleRefresh = () => {
    if (!effectivePeriodParams) return;
    void dispatch(fetchAnalyticsOverviewForceThunk(effectivePeriodParams));
    if (canAccessStockAlerts(user?.role, menus)) {
      void dispatch(fetchStockAlertsThunk({ force: true }));
    }
  };

  if (loading) {
    return (
      <section className="page-shell page-content space-y-6">
        <PageHeader title="Dashboard" description="Loading analytics…" />
        <AnalyticsDashboardSkeleton />
      </section>
    );
  }

  if (error && !overview) {
    return (
      <section className="page-shell page-content">
        <EmptyState title="Dashboard unavailable" description={error} />
      </section>
    );
  }

  if (!overview) {
    return (
      <section className="page-shell page-content">
        <EmptyState title="No analytics data" description="Try refreshing the dashboard." />
      </section>
    );
  }

  const { visibility, charts, widgets } = overview;

  return (
    <section className="page-shell page-content space-y-6">
      <PageHeader
        title="Dashboard"
        description={
          user
            ? `Welcome back, ${user.fullName}. Insights for ${overview.period.label}.`
            : "Business insights for your cafe."
        }
        action={
          <div className="flex flex-wrap items-center gap-2">
            <AnalyticsQuickActions />
            {visibility.financials ? <AnalyticsExportMenu overview={overview} /> : null}
            <Button type="button" variant="secondary" size="sm" onClick={handleRefresh}>
              <RefreshCw className="mr-1.5 h-4 w-4" aria-hidden />
              Refresh
            </Button>
          </div>
        }
      />

      <div className="space-y-2">
        <ReportPeriodFilter period={periodParams} onPeriodChange={setPeriodParams} compact showSnapshotHint />
        <p className="text-xs text-[var(--color-muted)]">
          Compared to {overview.comparisonPeriod.label}
        </p>
      </div>

      {!visibility.financials && widgets.staffTodaySummary ? (
        <StaffTodaySummary data={widgets.staffTodaySummary} />
      ) : null}

      <AnalyticsKpiGrid overview={overview} periodParams={effectivePeriodParams ?? { period: "this_month" }} />

      {visibility.financials && charts.salesTrend ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <SalesTrendChart data={charts.salesTrend} />
          {charts.profitExpense ? <ProfitExpenseChart data={charts.profitExpense} /> : null}
        </div>
      ) : null}

      {visibility.financials ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {charts.topMenuItems ? <TopMenuItemsChart data={charts.topMenuItems} /> : null}
          {charts.salesByCategory ? <SalesByCategoryChart data={charts.salesByCategory} /> : null}
          {charts.paymentMethods ? <PaymentMethodsChart data={charts.paymentMethods} /> : null}
          {charts.peakHours ? <PeakHoursChart data={charts.peakHours} /> : null}
          {charts.receivablesAging ? <ReceivablesAgingChart data={charts.receivablesAging} /> : null}
          {charts.supplierPayables ? <SupplierPayablesChart data={charts.supplierPayables} /> : null}
          {charts.salesByServiceType ? <ServiceTypeChart data={charts.salesByServiceType} /> : null}
          {charts.expenseByCategory ? <ExpenseCategoryChart data={charts.expenseByCategory} /> : null}
        </div>
      ) : null}

      {visibility.tables && widgets.tableStatus ? (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Table management</h2>
          <TableStatusCards data={widgets.tableStatus} linkToOrders />
          {charts.tableOccupancy ? <TableOccupancyChart data={charts.tableOccupancy} /> : null}
        </div>
      ) : null}

      {visibility.inventory && widgets.lowStock ? (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Inventory</h2>
          <LowStockTable data={widgets.lowStock} />
        </div>
      ) : null}

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Activity</h2>
        <ActivityFeedWidget
          data={widgets.activityFeed}
          periodParams={effectivePeriodParams ?? { period: "this_month" }}
        />
      </div>
    </section>
  );
}

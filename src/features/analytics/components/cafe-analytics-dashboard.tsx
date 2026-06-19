"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/src/components/shared/page-header";
import { EmptyState } from "@/src/components/ui/empty-state";
import { ReportPeriodFilter } from "@/src/features/reports/components/report-period-filter";
import { AnalyticsDashboardToolbar } from "@/src/features/analytics/components/analytics-dashboard-toolbar";
import { AnalyticsKpiGrid } from "@/src/features/analytics/components/kpi/analytics-kpi-grid";
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
  AssetsSummaryWidget,
  LowStockTable,
  StaffTodaySummary,
  TableStatusCards,
} from "@/src/features/analytics/components/widgets/analytics-widgets";
import { useAnalyticsPeriod } from "@/src/features/analytics/hooks/use-analytics-period";
import {
  ANALYTICS_DEFAULT_PERIOD,
  analyticsCacheKey,
} from "@/src/features/analytics/types/analytics.types";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import {
  fetchAnalyticsOverviewForceThunk,
  fetchAnalyticsOverviewThunk,
} from "@/src/store/slices/analytics.slice";
import { fetchStockAlertsThunk } from "@/src/store/slices/dashboard.slice";
import { canAccessStockAlerts } from "@/src/lib/stock-alerts-access";
import { canAccessAssets } from "@/src/lib/assets-access";
import type { AssetsSummary } from "@/src/lib/asset-types";
import { appToast } from "@/src/lib/toast";
import { operationsApi } from "@/src/services/operations-api";

export function CafeAnalyticsDashboard() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const menus = useAppSelector((state) => state.menu.items);
  const { periodParams, effectivePeriodParams, setPeriodParams } = useAnalyticsPeriod();
  const { cache, status, error } = useAppSelector((state) => state.analytics);
  const [assetsSummary, setAssetsSummary] = useState<AssetsSummary | null>(null);

  const cacheKey = analyticsCacheKey(effectivePeriodParams ?? { period: ANALYTICS_DEFAULT_PERIOD });
  const overview = cache[cacheKey]?.overview;
  const loading = status === "loading" && !overview;
  const refreshing = status === "loading" && Boolean(overview);

  useEffect(() => {
    if (!effectivePeriodParams) return;
    void dispatch(fetchAnalyticsOverviewThunk(effectivePeriodParams));
    if (canAccessStockAlerts(user?.role, menus)) {
      void dispatch(fetchStockAlertsThunk());
    }
    if (canAccessAssets(user?.role, menus)) {
      void operationsApi.assets.summary().then(setAssetsSummary).catch(() => setAssetsSummary(null));
    }
  }, [dispatch, effectivePeriodParams, menus, user?.role]);

  const handleRefresh = () => {
    if (!effectivePeriodParams || refreshing) return;

    void (async () => {
      const result = await dispatch(fetchAnalyticsOverviewForceThunk(effectivePeriodParams));
      if (fetchAnalyticsOverviewForceThunk.fulfilled.match(result)) {
        appToast.success("Dashboard data reloaded");
      } else if (
        fetchAnalyticsOverviewForceThunk.rejected.match(result) &&
        !result.meta.aborted
      ) {
        appToast.error(result.payload ?? "Failed to reload dashboard");
      }

      if (canAccessStockAlerts(user?.role, menus)) {
        void dispatch(fetchStockAlertsThunk({ force: true }));
      }
      if (canAccessAssets(user?.role, menus)) {
        void operationsApi.assets
          .summary()
          .then(setAssetsSummary)
          .catch(() => setAssetsSummary(null));
      }
    })();
  };

  if (loading) {
    return (
      <section className="page-shell page-content min-w-0 space-y-6">
        <PageHeader title="Dashboard" description="Loading analytics…" />
        <AnalyticsDashboardSkeleton />
      </section>
    );
  }

  if (error && !overview) {
    return (
      <section className="page-shell page-content min-w-0">
        <EmptyState title="Dashboard unavailable" description={error} />
      </section>
    );
  }

  if (!overview) {
    return (
      <section className="page-shell page-content min-w-0">
        <EmptyState title="No analytics data" description="Try refreshing the dashboard." />
      </section>
    );
  }

  const { visibility, charts, widgets } = overview;

  return (
    <section className="page-shell page-content min-w-0 space-y-6">
      <PageHeader
        title="Dashboard"
        description={
          user
            ? `Welcome back, ${user.fullName}. Insights for ${overview.period.label}.`
            : "Business insights for your cafe."
        }
        actionClassName="max-md:w-full max-md:[&_a]:flex"
        action={
          <AnalyticsDashboardToolbar
            overview={overview}
            showExport={visibility.financials}
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }
      />

      <div className="min-w-0 space-y-2">
        <ReportPeriodFilter period={periodParams} onPeriodChange={setPeriodParams} compact showSnapshotHint />
        <p className="break-words text-xs leading-relaxed text-[var(--color-muted)]">
          Compared to {overview.comparisonPeriod.label}
          {" · "}
          Last updated {new Date(overview.generatedAt).toLocaleString()}
        </p>
      </div>

      {!visibility.financials && widgets.staffTodaySummary ? (
        <StaffTodaySummary data={widgets.staffTodaySummary} />
      ) : null}

      <AnalyticsKpiGrid
        overview={overview}
        periodParams={effectivePeriodParams ?? { period: ANALYTICS_DEFAULT_PERIOD }}
      />

      {visibility.financials && charts.salesTrend ? (
        <div className="grid w-full min-w-0 grid-cols-1 gap-4 lg:grid-cols-2 [&>*]:min-w-0">
          <SalesTrendChart data={charts.salesTrend} />
          {charts.profitExpense ? (
            <ProfitExpenseChart data={charts.profitExpense} period={effectivePeriodParams?.period} />
          ) : null}
        </div>
      ) : null}

      {visibility.financials ? (
        <div className="grid w-full min-w-0 grid-cols-1 gap-4 lg:grid-cols-2 [&>*]:min-w-0">
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
        <div className="min-w-0 space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Table management</h2>
          <TableStatusCards data={widgets.tableStatus} linkToOrders />
          {charts.tableOccupancy ? <TableOccupancyChart data={charts.tableOccupancy} /> : null}
        </div>
      ) : null}

      {visibility.inventory && widgets.lowStock ? (
        <div className="min-w-0 space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Inventory</h2>
          <LowStockTable data={widgets.lowStock} />
        </div>
      ) : null}

      {canAccessAssets(user?.role, menus) && assetsSummary ? (
        <AssetsSummaryWidget data={assetsSummary} />
      ) : null}

      <div className="min-w-0 space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Activity</h2>
        <ActivityFeedWidget
          data={widgets.activityFeed}
          periodParams={effectivePeriodParams ?? { period: ANALYTICS_DEFAULT_PERIOD }}
        />
      </div>
    </section>
  );
}

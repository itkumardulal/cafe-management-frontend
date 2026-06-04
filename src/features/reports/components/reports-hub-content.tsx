"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/src/components/shared/page-header";
import { EmptyState } from "@/src/components/ui/empty-state";
import { ReportEntryCards } from "@/src/features/reports/components/report-entry-cards";
import { ReportKpiGrid } from "@/src/features/reports/components/report-kpi-grid";
import {
  ReportPeriodFilter,
  parsePeriodFromSearchParams,
} from "@/src/features/reports/components/report-period-filter";
import { ReportsHubSkeleton } from "@/src/features/reports/components/reports-skeleton";
import type { ReportPeriodParams, ReportsSummary } from "@/src/features/reports/types/reports.types";
import { getEffectiveReportPeriodParams } from "@/src/features/reports/types/reports.types";
import { appToast } from "@/src/lib/toast";
import { operationsApi } from "@/src/services/operations-api";

export function useReportPeriodNavigation() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const periodParams = useMemo(
    () => parsePeriodFromSearchParams(searchParams),
    [searchParams],
  );
  const effectivePeriodParams = useMemo(
    () => getEffectiveReportPeriodParams(periodParams),
    [periodParams],
  );

  const setPeriodParams = useCallback(
    (params: ReportPeriodParams) => {
      const next = new URLSearchParams();
      next.set("period", params.period ?? "this_month");
      if (params.period === "custom") {
        if (params.fromDate) next.set("fromDate", params.fromDate);
        if (params.toDate) next.set("toDate", params.toDate);
      }
      router.replace(`?${next.toString()}`);
    },
    [router],
  );

  return { periodParams, effectivePeriodParams, setPeriodParams };
}

export function ReportsHubPage() {
  const { periodParams, effectivePeriodParams, setPeriodParams } = useReportPeriodNavigation();
  const [summary, setSummary] = useState<ReportsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void operationsApi.reports
      .summary(effectivePeriodParams)
      .then((data) => {
        if (!cancelled) setSummary(data);
      })
      .catch(() => appToast.error("Failed to load reports summary"))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [effectivePeriodParams]);

  if (loading) {
    return <ReportsHubSkeleton />;
  }

  return (
    <section className="page-shell page-content space-y-6">
      <PageHeader
        title="Reports"
        description="Understand sales, profit, expenses, inventory, and outstanding balances without opening individual transactions."
      />

      <ReportPeriodFilter
        period={periodParams}
        onPeriodChange={setPeriodParams}
        showSnapshotHint
      />

      {summary ? (
        <>
          <ReportKpiGrid summary={summary} periodParams={periodParams} />
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Detailed reports</h2>
              <p className="text-xs text-muted">
                Drill into each area for tables, trends, and operational detail.
              </p>
            </div>
            <ReportEntryCards periodParams={periodParams} />
          </div>
        </>
      ) : (
        <EmptyState
          title="No report data yet"
          description="Try a wider date range, or record sales and expenses to populate your analytics."
        />
      )}
    </section>
  );
}

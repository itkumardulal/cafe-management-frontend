"use client";

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { parsePeriodFromSearchParams } from "@/src/features/reports/components/report-period-filter";
import type { AnalyticsPeriodParams } from "@/src/features/analytics/types/analytics.types";
import { getEffectiveReportPeriodParams } from "@/src/features/reports/types/reports.types";

export function useAnalyticsPeriod() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const periodParams = useMemo(
    () => parsePeriodFromSearchParams(searchParams) as AnalyticsPeriodParams,
    [searchParams],
  );

  const effectivePeriodParams = useMemo(
    () => getEffectiveReportPeriodParams(periodParams) as AnalyticsPeriodParams,
    [periodParams],
  );

  const setPeriodParams = useCallback(
    (params: AnalyticsPeriodParams) => {
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

"use client";

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { AnalyticsPeriodParams } from "@/src/features/analytics/types/analytics.types";
import { ANALYTICS_DEFAULT_PERIOD } from "@/src/features/analytics/types/analytics.types";
import { getEffectiveReportPeriodParams } from "@/src/features/reports/types/reports.types";

function parseAnalyticsPeriodFromSearchParams(
  searchParams: URLSearchParams,
): AnalyticsPeriodParams {
  const period = (searchParams.get("period") as AnalyticsPeriodParams["period"] | null)
    ?? ANALYTICS_DEFAULT_PERIOD;
  const fromDate = searchParams.get("fromDate") ?? undefined;
  const toDate = searchParams.get("toDate") ?? undefined;
  return { period, fromDate, toDate };
}

export function useAnalyticsPeriod() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const periodParams = useMemo(
    () => parseAnalyticsPeriodFromSearchParams(searchParams),
    [searchParams],
  );

  const effectivePeriodParams = useMemo(() => {
    const effective = getEffectiveReportPeriodParams(periodParams);
    if (!effective) {
      return { period: ANALYTICS_DEFAULT_PERIOD };
    }
    if (!effective.period) {
      return { ...effective, period: ANALYTICS_DEFAULT_PERIOD };
    }
    return effective as AnalyticsPeriodParams;
  }, [periodParams]);

  const setPeriodParams = useCallback(
    (params: AnalyticsPeriodParams) => {
      const next = new URLSearchParams();
      next.set("period", params.period ?? ANALYTICS_DEFAULT_PERIOD);
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

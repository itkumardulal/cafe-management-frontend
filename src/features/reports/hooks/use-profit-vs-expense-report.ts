"use client";

import { useEffect, useState } from "react";
import { appToast } from "@/src/lib/toast";
import type { ProfitVsExpenseReport, ReportPeriodParams } from "@/src/features/reports/types/reports.types";
import { operationsApi } from "@/src/services/operations-api";

export function useProfitVsExpenseReport(
  periodParams: ReportPeriodParams | undefined,
  errorMessage = "Failed to load profit vs expense report",
) {
  const [data, setData] = useState<ProfitVsExpenseReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!periodParams) {
      setLoading(false);
      setData(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    void operationsApi.reports
      .profitVsExpense(periodParams)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch(() => appToast.error(errorMessage))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [periodParams, errorMessage]);

  return { data, loading };
}

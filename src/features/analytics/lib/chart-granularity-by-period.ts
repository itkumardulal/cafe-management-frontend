import type { ReportPeriodKey } from "@/src/features/reports/types/reports.types";
import type { ChartGranularity } from "@/src/features/analytics/lib/rebucket-time-series";

const ALL_GRANULARITIES: ChartGranularity[] = ["day", "week", "month"];

const PERIOD_GRANULARITY: Partial<Record<ReportPeriodKey, ChartGranularity>> = {
  today: "day",
  yesterday: "day",
  last_7_days: "week",
  this_week: "week",
  last_30_days: "month",
  this_month: "month",
  last_month: "month",
};

export function resolveChartGranularityOptions(
  period?: ReportPeriodKey,
): ChartGranularity[] {
  if (!period || period === "custom") {
    return ALL_GRANULARITIES;
  }
  const locked = PERIOD_GRANULARITY[period];
  return locked ? [locked] : ALL_GRANULARITIES;
}

export function resolveChartGranularity(
  period: ReportPeriodKey | undefined,
  selected: ChartGranularity,
): ChartGranularity {
  const options = resolveChartGranularityOptions(period);
  if (options.includes(selected)) {
    return selected;
  }
  return options[0] ?? "day";
}

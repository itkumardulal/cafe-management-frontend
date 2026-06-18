import { describe, expect, it } from "vitest";
import {
  resolveChartGranularity,
  resolveChartGranularityOptions,
} from "@/src/features/analytics/lib/chart-granularity-by-period";

describe("chart-granularity-by-period", () => {
  it("locks today to day only", () => {
    expect(resolveChartGranularityOptions("today")).toEqual(["day"]);
    expect(resolveChartGranularity("today", "month")).toBe("day");
  });

  it("locks last_7_days to week only", () => {
    expect(resolveChartGranularityOptions("last_7_days")).toEqual(["week"]);
  });

  it("locks this_month to month only", () => {
    expect(resolveChartGranularityOptions("this_month")).toEqual(["month"]);
  });

  it("allows all options for custom", () => {
    expect(resolveChartGranularityOptions("custom")).toEqual(["day", "week", "month"]);
  });
});

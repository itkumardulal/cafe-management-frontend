import { describe, expect, it } from "vitest";
import { analyticsCacheKey } from "@/src/features/analytics/types/analytics.types";

describe("analyticsCacheKey", () => {
  it("defaults to today when period omitted", () => {
    expect(analyticsCacheKey({})).toBe("today");
  });

  it("includes custom dates", () => {
    expect(
      analyticsCacheKey({ period: "custom", fromDate: "2026-01-01", toDate: "2026-01-31" }),
    ).toBe("custom:2026-01-01:2026-01-31");
  });
});

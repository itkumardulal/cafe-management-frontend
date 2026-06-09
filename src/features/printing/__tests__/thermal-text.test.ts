import { describe, expect, it } from "vitest";
import { formatMoneyCompact } from "@/src/features/printing/lib/thermal-money";
import {
  formatCompactDateTime,
  truncateThermalText,
  wrapThermalText,
} from "@/src/features/printing/lib/thermal-text";

describe("truncateThermalText", () => {
  it("returns short text unchanged", () => {
    expect(truncateThermalText("Espresso", 20)).toBe("Espresso");
  });

  it("truncates long text with ellipsis", () => {
    expect(truncateThermalText("Very long menu item name for thermal", 12)).toBe(
      "Very long m…",
    );
  });
});

describe("wrapThermalText", () => {
  it("wraps words across lines", () => {
    expect(wrapThermalText("123 Main Street Kathmandu Nepal", 16)).toEqual([
      "123 Main Street",
      "Kathmandu Nepal",
    ]);
  });

  it("splits oversized single words", () => {
    expect(wrapThermalText("ABCDEFGHIJKLMNOP", 8)).toEqual(["ABCDEFGH", "IJKLMNOP"]);
  });
});

describe("formatCompactDateTime", () => {
  it("returns dash for empty input", () => {
    expect(formatCompactDateTime(null)).toBe("—");
  });

  it("formats valid ISO timestamps", () => {
    const formatted = formatCompactDateTime("2026-06-08T14:30:00.000Z");
    expect(formatted).toContain("2026");
    expect(formatted).not.toBe("—");
  });
});

describe("formatMoneyCompact", () => {
  it("formats numbers with two decimals", () => {
    expect(formatMoneyCompact(1234.5)).toBe("1,234.50");
  });

  it("handles invalid values", () => {
    expect(formatMoneyCompact("not-a-number")).toBe("0.00");
  });
});

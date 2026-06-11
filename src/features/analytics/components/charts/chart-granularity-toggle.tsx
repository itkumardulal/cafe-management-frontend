"use client";

import { cn } from "@/src/lib/cn";
import type { ChartGranularity } from "@/src/features/analytics/lib/rebucket-time-series";

const OPTIONS: Array<{ key: ChartGranularity; label: string }> = [
  { key: "day", label: "Day" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
];

export function ChartGranularityToggle({
  value,
  onChange,
  className,
}: {
  value: ChartGranularity;
  onChange: (value: ChartGranularity) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex rounded-lg border border-[var(--color-border)] bg-[var(--color-cream-100)] p-0.5",
        className,
      )}
      role="group"
      aria-label="Chart granularity"
    >
      {OPTIONS.map((opt) => (
        <button
          key={opt.key}
          type="button"
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
            value === opt.key
              ? "bg-[var(--color-surface)] text-foreground shadow-sm"
              : "text-[var(--color-muted)] hover:text-foreground",
          )}
          onClick={() => onChange(opt.key)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

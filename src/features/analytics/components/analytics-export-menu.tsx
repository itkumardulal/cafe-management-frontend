"use client";

import { Download } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import type { AnalyticsOverview } from "@/src/features/analytics/types/analytics.types";
import {
  exportAnalyticsCsv,
  exportAnalyticsExcel,
  exportAnalyticsPdf,
} from "@/src/features/analytics/lib/analytics-export";
import { appToast } from "@/src/lib/toast";

export function AnalyticsExportMenu({ overview }: { overview: AnalyticsOverview }) {
  return (
    <div
      className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-cream-100)] p-0.5 max-md:gap-0.5 md:flex-wrap md:gap-2 md:border-0 md:bg-transparent md:p-0"
      role="group"
      aria-label="Export dashboard"
    >
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="max-md:h-9 max-md:w-9 max-md:shrink-0 max-md:justify-center max-md:rounded-md max-md:border-0 max-md:bg-[var(--color-surface)] max-md:p-0 max-md:shadow-sm md:px-3"
        aria-label="Export Excel"
        onClick={() => {
          void exportAnalyticsExcel(overview).catch(() => appToast.error("Export failed"));
        }}
      >
        <Download className="h-4 w-4 md:mr-1.5" aria-hidden />
        <span className="max-md:sr-only">Excel</span>
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="max-md:h-9 max-md:w-9 max-md:shrink-0 max-md:justify-center max-md:rounded-md max-md:border-0 max-md:bg-[var(--color-surface)] max-md:p-0 max-md:shadow-sm md:px-3"
        aria-label="Export CSV"
        onClick={() => exportAnalyticsCsv(overview)}
      >
        <Download className="h-4 w-4 md:mr-1.5" aria-hidden />
        <span className="max-md:sr-only">CSV</span>
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="max-md:h-9 max-md:w-9 max-md:shrink-0 max-md:justify-center max-md:rounded-md max-md:border-0 max-md:bg-[var(--color-surface)] max-md:p-0 max-md:shadow-sm md:px-3"
        aria-label="Export PDF"
        onClick={() => {
          void exportAnalyticsPdf(overview).catch(() => appToast.error("Export failed"));
        }}
      >
        <Download className="h-4 w-4 md:mr-1.5" aria-hidden />
        <span className="max-md:sr-only">PDF</span>
      </Button>
    </div>
  );
}

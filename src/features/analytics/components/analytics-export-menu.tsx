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
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => {
          void exportAnalyticsExcel(overview).catch(() => appToast.error("Export failed"));
        }}
      >
        <Download className="mr-1.5 h-4 w-4" aria-hidden />
        Excel
      </Button>
      <Button type="button" variant="secondary" size="sm" onClick={() => exportAnalyticsCsv(overview)}>
        <Download className="mr-1.5 h-4 w-4" aria-hidden />
        CSV
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => {
          void exportAnalyticsPdf(overview).catch(() => appToast.error("Export failed"));
        }}
      >
        <Download className="mr-1.5 h-4 w-4" aria-hidden />
        PDF
      </Button>
    </div>
  );
}

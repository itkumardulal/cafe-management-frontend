"use client";

import { Download, RefreshCw } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Dropdown } from "@/src/components/ui/dropdown";
import type { AnalyticsOverview } from "@/src/features/analytics/types/analytics.types";
import {
  exportAnalyticsCsv,
  exportAnalyticsExcel,
  exportAnalyticsPdf,
} from "@/src/features/analytics/lib/analytics-export";
import { appToast } from "@/src/lib/toast";

function ExportControls({
  overview,
  layout,
}: {
  overview: AnalyticsOverview;
  layout: "mobile" | "desktop";
}) {
  if (layout === "mobile") {
    return (
      <div className="min-w-0 flex-1 [&_button]:w-full">
        <Dropdown
          label="Export"
          items={[
            {
              id: "excel",
              label: "Export Excel",
              onClick: () => {
                void exportAnalyticsExcel(overview)
                  .then(() => appToast.success("Excel export downloaded"))
                  .catch(() => appToast.error("Export failed"));
              },
            },
            {
              id: "csv",
              label: "Export CSV",
              onClick: () => {
                exportAnalyticsCsv(overview);
                appToast.success("CSV export downloaded");
              },
            },
            {
              id: "pdf",
              label: "Export PDF",
              onClick: () => {
                void exportAnalyticsPdf(overview)
                  .then(() => appToast.success("PDF export downloaded"))
                  .catch(() => appToast.error("Export failed"));
              },
            },
          ]}
        />
      </div>
    );
  }

  return (
    <div className="inline-flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => {
          void exportAnalyticsExcel(overview)
            .then(() => appToast.success("Excel export downloaded"))
            .catch(() => appToast.error("Export failed"));
        }}
      >
        <Download className="mr-1.5 h-4 w-4" aria-hidden />
        Excel
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => {
          exportAnalyticsCsv(overview);
          appToast.success("CSV export downloaded");
        }}
      >
        <Download className="mr-1.5 h-4 w-4" aria-hidden />
        CSV
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => {
          void exportAnalyticsPdf(overview)
            .then(() => appToast.success("PDF export downloaded"))
            .catch(() => appToast.error("Export failed"));
        }}
      >
        <Download className="mr-1.5 h-4 w-4" aria-hidden />
        PDF
      </Button>
    </div>
  );
}

export function AnalyticsDashboardToolbar({
  overview,
  showExport,
  refreshing,
  onRefresh,
}: {
  overview: AnalyticsOverview;
  showExport: boolean;
  refreshing?: boolean;
  onRefresh: () => void;
}) {
  const refreshButton = (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      loading={refreshing}
      disabled={refreshing}
      onClick={onRefresh}
      title="Reload the latest sales, cash, and chart data for this period"
    >
      {!refreshing ? <RefreshCw className="mr-1.5 h-4 w-4" aria-hidden /> : null}
      {refreshing ? "Reloading…" : "Reload data"}
    </Button>
  );

  if (!showExport) {
    return refreshButton;
  }

  return (
    <>
      {/* Mobile: grouped toolbar card */}
      <div className="surface-card density-compact flex w-full min-w-0 items-stretch gap-2 p-3 md:hidden">
        <ExportControls overview={overview} layout="mobile" />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          loading={refreshing}
          disabled={refreshing}
          onClick={onRefresh}
          className="h-11 shrink-0 px-3"
          title="Reload the latest sales, cash, and chart data for this period"
          aria-label="Reload dashboard data"
        >
          {!refreshing ? <RefreshCw className="h-4 w-4" aria-hidden /> : null}
          <span className="sr-only">{refreshing ? "Reloading dashboard" : "Reload dashboard data"}</span>
        </Button>
      </div>

      {/* Desktop: inline toolbar */}
      <div className="hidden min-w-0 flex-wrap items-center justify-end gap-2 md:flex">
        <ExportControls overview={overview} layout="desktop" />
        {refreshButton}
      </div>
    </>
  );
}

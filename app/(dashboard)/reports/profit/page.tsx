"use client";

import { Suspense } from "react";
import { EmptyState } from "@/src/components/ui/empty-state";
import { ReportProfitItemsTable } from "@/src/features/reports/components/report-profit-items-table";
import {
  ReportInsightCard,
  ReportSection,
  ReportSummaryCard,
  ReportSummaryStrip,
} from "@/src/features/reports/components/report-detail-shell";
import { ReportProfitWaterfall } from "@/src/features/reports/components/report-profit-waterfall";
import { ReportPageLayout } from "@/src/features/reports/components/report-page-layout";
import { ReportDetailSkeleton } from "@/src/features/reports/components/reports-skeleton";
import { useReportPeriodNavigation } from "@/src/features/reports/components/reports-hub-content";
import { useReportLoader } from "@/src/features/reports/hooks/use-report-loader";
import type { ProfitReport } from "@/src/features/reports/types/reports.types";
import { formatMoney } from "@/src/lib/format-display";
import { operationsApi } from "@/src/services/operations-api";

function ProfitReportContent() {
  const { periodParams, effectivePeriodParams, setPeriodParams } = useReportPeriodNavigation();
  const { data: report, loading } = useReportLoader<ProfitReport>(
    () => operationsApi.reports.profit(effectivePeriodParams),
    [effectivePeriodParams],
    "Failed to load profit report",
  );

  const margin = Number(report?.profitMarginPercent ?? 0);

  return (
    <ReportPageLayout
      slug="profit"
      periodParams={periodParams}
      onPeriodChange={setPeriodParams}
      periodLabel={report?.period.label}
      loading={loading}
      summary={
        report && !loading ? (
          <div className="space-y-3">
            <ReportSummaryStrip>
              <ReportSummaryCard
                label="Gross profit"
                value={formatMoney(report.grossProfit)}
                hint="After discounts and COGS"
                tone={margin >= 0 ? "positive" : "negative"}
              />
              <ReportSummaryCard
                label="Period margin"
                value={`${report.profitMarginPercent}%`}
                hint="Gross profit ÷ net revenue for full period"
                tone={margin >= 30 ? "positive" : margin >= 15 ? "warning" : "negative"}
              />
            </ReportSummaryStrip>
            <ReportProfitWaterfall
              grossSalesBeforeDiscount={report.grossSalesBeforeDiscount}
              totalDiscountGiven={report.totalDiscountGiven}
              revenue={report.revenue}
              costOfGoodsSold={report.costOfGoodsSold}
              grossProfit={report.grossProfit}
            />
            <ReportInsightCard title="How profit is calculated">{report.costPriceNote}</ReportInsightCard>
          </div>
        ) : null
      }
    >
      {loading ? (
        <ReportDetailSkeleton columns={6} />
      ) : report && report.topProfitableItems.length > 0 ? (
        <ReportSection
          title="Most profitable items"
          description="Per-item margin uses line revenue (before bill discounts). Period margin above uses net revenue after discounts for all sales."
          count={report.topProfitableItems.length}
        >
          <ReportProfitItemsTable
            items={report.topProfitableItems}
            totalDiscountGiven={report.totalDiscountGiven}
            grossProfit={report.grossProfit}
            periodLabel={report.period.label}
          />
        </ReportSection>
      ) : (
        <EmptyState title="No profit data in this period" description="Try widening the date range." />
      )}
    </ReportPageLayout>
  );
}

export default function ProfitReportPage() {
  return (
    <Suspense fallback={<ReportDetailSkeleton columns={6} summaryCards={2} showWaterfall />}>
      <ProfitReportContent />
    </Suspense>
  );
}

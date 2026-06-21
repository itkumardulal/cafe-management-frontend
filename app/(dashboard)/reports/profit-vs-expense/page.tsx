"use client";

import { Suspense } from "react";
import { EmptyState } from "@/src/components/ui/empty-state";
import { ProfitExpenseChart } from "@/src/features/analytics/components/charts/analytics-charts";
import { ReportDiscountTransactionsTable } from "@/src/features/reports/components/report-discount-transactions-table";
import { ReportExpenseCategoryTable } from "@/src/features/reports/components/report-expense-category-table";
import {
  ReportInsightCard,
  ReportSection,
} from "@/src/features/reports/components/report-detail-shell";
import { ReportProfitExpenseWaterfall } from "@/src/features/reports/components/report-profit-expense-waterfall";
import { ReportProfitItemsTable } from "@/src/features/reports/components/report-profit-items-table";
import { ReportPageLayout } from "@/src/features/reports/components/report-page-layout";
import { ReportDetailSkeleton } from "@/src/features/reports/components/reports-skeleton";
import { useReportPeriodNavigation } from "@/src/features/reports/components/reports-hub-content";
import { useProfitVsExpenseReport } from "@/src/features/reports/hooks/use-profit-vs-expense-report";
import {
  PROFIT_VS_EXPENSE_SECTION_IDS,
  type ProfitVsExpenseDetailSectionLinks,
} from "@/src/features/reports/lib/profit-vs-expense-sections";

function ProfitVsExpenseReportContent() {
  const { periodParams, effectivePeriodParams, setPeriodParams } = useReportPeriodNavigation();
  const { data: report, loading } = useProfitVsExpenseReport(effectivePeriodParams);

  const chartBuckets = report?.profitExpenseChart;
  const categoryRows = report?.expenseByCategory ?? [];
  const profitItems = report?.topProfitableItems ?? [];
  const discountItems = report?.discountTransactions.items ?? [];
  const discountTotal = report?.discountTransactions.meta.total ?? 0;

  const hasDetailTables =
    categoryRows.length > 0 || profitItems.length > 0 || discountItems.length > 0;

  const detailSectionLinks: ProfitVsExpenseDetailSectionLinks = {
    expenseCategories:
      categoryRows.length > 0 ? PROFIT_VS_EXPENSE_SECTION_IDS.expenseCategories : undefined,
    profitableItems:
      profitItems.length > 0 ? PROFIT_VS_EXPENSE_SECTION_IDS.profitableItems : undefined,
    discountTransactions:
      discountItems.length > 0 ? PROFIT_VS_EXPENSE_SECTION_IDS.discountTransactions : undefined,
  };

  return (
    <ReportPageLayout
      slug="profit-vs-expense"
      periodParams={periodParams}
      onPeriodChange={setPeriodParams}
      periodLabel={report?.period.label}
      loading={loading}
      skeletonColumns={4}
      summary={
        report && !loading ? (
          <div className="space-y-4">
            <ReportProfitExpenseWaterfall
              data={report.breakdown}
              periodParams={periodParams}
              periodLabel={report.period.label}
              detailSectionLinks={detailSectionLinks}
            />
            {chartBuckets ? (
              <ReportSection
                title="Period trend"
                description="Revenue, expenses, and net profit over time."
              >
                <ProfitExpenseChart
                  data={chartBuckets}
                  period={effectivePeriodParams?.period}
                />
              </ReportSection>
            ) : null}
            <ReportInsightCard title="How profit is calculated">
              {report.costPriceNote}
            </ReportInsightCard>
          </div>
        ) : null
      }
    >
      {loading ? (
        <ReportDetailSkeleton columns={4} showWaterfall />
      ) : report && hasDetailTables ? (
        <div className="space-y-8">
          {categoryRows.length > 0 ? (
            <ReportExpenseCategoryTable
              rows={categoryRows}
              periodLabel={report.period.label}
              exportSlug="profit-vs-expense"
              sectionId={PROFIT_VS_EXPENSE_SECTION_IDS.expenseCategories}
            />
          ) : null}

          {profitItems.length > 0 ? (
            <ReportSection
              id={PROFIT_VS_EXPENSE_SECTION_IDS.profitableItems}
              title="Most profitable items"
              description="Per-item margin uses line revenue (before bill discounts). Period margin above uses net revenue after discounts for all sales."
              count={profitItems.length}
            >
              <ReportProfitItemsTable
                items={profitItems}
                totalDiscountGiven={report.breakdown.totalDiscountGiven}
                grossProfit={report.breakdown.grossProfit}
                periodLabel={report.period.label}
                exportSlug="profit-vs-expense"
                costPriceNote={report.costPriceNote}
              />
            </ReportSection>
          ) : null}

          {discountItems.length > 0 ? (
            <ReportDiscountTransactionsTable
              items={discountItems}
              totalCount={discountTotal}
              periodLabel={report.period.label}
              periodParams={effectivePeriodParams}
              exportSlug="profit-vs-expense"
              sectionId={PROFIT_VS_EXPENSE_SECTION_IDS.discountTransactions}
            />
          ) : null}
        </div>
      ) : report ? (
        <EmptyState
          title="No detail tables for this period"
          description="Expense categories, profitable items, and discount bills will appear here when data is recorded."
        />
      ) : null}
    </ReportPageLayout>
  );
}

export default function ProfitVsExpenseReportPage() {
  return (
    <Suspense fallback={<ReportDetailSkeleton columns={4} showWaterfall />}>
      <ProfitVsExpenseReportContent />
    </Suspense>
  );
}

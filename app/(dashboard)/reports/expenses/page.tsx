"use client";

import { Suspense, useMemo } from "react";
import { EmptyState } from "@/src/components/ui/empty-state";
import { ListCard, ListCardStack } from "@/src/components/shared/list-card";
import { ReportDataTable } from "@/src/features/reports/components/report-data-table";
import { ReportExportButton } from "@/src/features/reports/components/report-export-button";
import {
  ReportInsightCard,
  ReportSection,
  ReportSummaryCard,
  ReportSummaryStrip,
} from "@/src/features/reports/components/report-detail-shell";
import { ReportTableFooterRow } from "@/src/features/reports/components/report-table-footer-row";
import { ReportTableMobileTotalCard } from "@/src/features/reports/components/report-table-mobile-total-card";
import { ReportPageLayout } from "@/src/features/reports/components/report-page-layout";
import { ReportDetailSkeleton } from "@/src/features/reports/components/reports-skeleton";
import { useReportPeriodNavigation } from "@/src/features/reports/components/reports-hub-content";
import { useReportLoader } from "@/src/features/reports/hooks/use-report-loader";
import { buildReportExportFileName } from "@/src/features/reports/lib/build-report-export-file-name";
import { sumDecimalStrings } from "@/src/features/reports/lib/report-table-totals";
import type { ExpenseReport } from "@/src/features/reports/types/reports.types";
import { cn } from "@/src/lib/cn";
import { formatMoney } from "@/src/lib/format-display";
import { operationsApi } from "@/src/services/operations-api";
import { tableCenterCellClass, tableCenterColumnClass } from "@/src/components/ui/table";

function ExpenseReportContent() {
  const { periodParams, effectivePeriodParams, setPeriodParams } = useReportPeriodNavigation();
  const { data: report, loading } = useReportLoader<ExpenseReport>(
    () => operationsApi.reports.expenses(effectivePeriodParams),
    [effectivePeriodParams],
    "Failed to load expense report",
  );

  const netAfter = Number(report?.comparison.netAfterExpenses ?? 0);
  const rows = report?.byCategory ?? [];
  const totalAmount = useMemo(
    () => sumDecimalStrings(rows.map((row) => row.amount)),
    [rows],
  );

  const getFooterRow = () => ["Total", Number(totalAmount), 100];

  return (
    <ReportPageLayout
      slug="expenses"
      periodParams={periodParams}
      onPeriodChange={setPeriodParams}
      periodLabel={report?.period.label}
      loading={loading}
      summary={
        report && !loading ? (
          <>
            <ReportSummaryStrip>
              <ReportSummaryCard
                label="Total expenses"
                value={formatMoney(report.totalExpenses)}
                tone="warning"
              />
              <ReportSummaryCard
                label="% of sales"
                value={`${report.comparison.expenseAsPercentOfSales}%`}
              />
              <ReportSummaryCard
                label="Net after expenses"
                value={formatMoney(report.comparison.netAfterExpenses)}
                tone={netAfter >= 0 ? "positive" : "negative"}
              />
              <ReportSummaryCard
                label="Period sales"
                value={formatMoney(report.comparison.periodSales)}
                tone="info"
              />
            </ReportSummaryStrip>
            <ReportInsightCard title="Operating snapshot">
              Gross profit for this period is{" "}
              <span className="font-semibold tabular-nums">
                {formatMoney(report.comparison.periodGrossProfit)}
              </span>
              . Net after expenses reflects profit minus recorded daily costs.
            </ReportInsightCard>
          </>
        ) : null
      }
    >
      {loading ? (
        <ReportDetailSkeleton columns={4} />
      ) : report && rows.length > 0 ? (
        <ReportSection
          title="Expenses by category"
          description="Share of total spend per category."
          count={rows.length}
          action={
            <ReportExportButton
              fileName={buildReportExportFileName("expenses", "by-category", report.period.label)}
              sheetName="By category"
              mode="loaded"
              rows={rows}
              columns={[
                { header: "Category", getValue: (row) => row.label },
                { header: "Amount", getValue: (row) => Number(row.amount) },
                { header: "% of total", getValue: (row) => Number(row.percentOfTotal) },
              ]}
              getFooterRow={getFooterRow}
            />
          }
        >
          <ReportDataTable
            headers={[
              "Category",
              { label: "Amount", thClassName: tableCenterColumnClass },
              { label: "% of total", thClassName: tableCenterColumnClass },
            ]}
            mobileCards={
              <ListCardStack>
                {rows.map((row) => (
                  <ListCard
                    key={row.category}
                    title={row.label}
                    fields={[
                      { label: "Amount", value: formatMoney(row.amount) },
                      { label: "% of total", value: `${row.percentOfTotal}%` },
                    ]}
                  />
                ))}
                <ReportTableMobileTotalCard
                  fields={[
                    { label: "Amount", value: formatMoney(totalAmount) },
                    { label: "% of total", value: "100%" },
                  ]}
                />
              </ListCardStack>
            }
            footer={
              <ReportTableFooterRow
                cells={[formatMoney(totalAmount), "100%"]}
              />
            }
          >
            {rows.map((row) => (
              <tr key={row.category}>
                <td className="font-medium">{row.label}</td>
                <td className={cn(tableCenterCellClass, "font-mono tabular-nums")}>
                  {formatMoney(row.amount)}
                </td>
                <td className={tableCenterCellClass}>{row.percentOfTotal}%</td>
              </tr>
            ))}
          </ReportDataTable>
        </ReportSection>
      ) : (
        <EmptyState title="No expenses in this period" description="Try widening the date range." />
      )}
    </ReportPageLayout>
  );
}

export default function ExpenseReportPage() {
  return (
    <Suspense fallback={<ReportDetailSkeleton columns={4} />}>
      <ExpenseReportContent />
    </Suspense>
  );
}

"use client";

import { Suspense } from "react";
import { EmptyState } from "@/src/components/ui/empty-state";
import { ListCard, ListCardStack } from "@/src/components/shared/list-card";
import { ReportDataTable } from "@/src/features/reports/components/report-data-table";
import {
  ReportInsightCard,
  ReportSection,
  ReportSummaryCard,
  ReportSummaryStrip,
} from "@/src/features/reports/components/report-detail-shell";
import { ReportPageLayout } from "@/src/features/reports/components/report-page-layout";
import { ReportDetailSkeleton } from "@/src/features/reports/components/reports-skeleton";
import { useReportPeriodNavigation } from "@/src/features/reports/components/reports-hub-content";
import { useReportLoader } from "@/src/features/reports/hooks/use-report-loader";
import type { ProfitReport } from "@/src/features/reports/types/reports.types";
import { cn } from "@/src/lib/cn";
import { formatMoney } from "@/src/lib/format-display";
import { operationsApi } from "@/src/services/operations-api";
import { tableCenterCellClass, tableCenterColumnClass } from "@/src/components/ui/table";

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
          <>
            <ReportSummaryStrip>
              <ReportSummaryCard label="Revenue" value={formatMoney(report.revenue)} tone="positive" />
              <ReportSummaryCard
                label="Cost of goods sold"
                value={formatMoney(report.costOfGoodsSold)}
                tone="warning"
              />
              <ReportSummaryCard
                label="Gross profit"
                value={formatMoney(report.grossProfit)}
                tone={margin >= 0 ? "positive" : "negative"}
              />
              <ReportSummaryCard
                label="Margin"
                value={`${report.profitMarginPercent}%`}
                tone={margin >= 30 ? "positive" : margin >= 15 ? "warning" : "negative"}
              />
            </ReportSummaryStrip>
            <ReportInsightCard title="How profit is calculated">{report.costPriceNote}</ReportInsightCard>
          </>
        ) : null
      }
    >
      {loading ? (
        <ReportDetailSkeleton columns={6} />
      ) : report && report.topProfitableItems.length > 0 ? (
        <ReportSection
          title="Most profitable items"
          description="Line-level profit before bill discounts are allocated."
          count={report.topProfitableItems.length}
        >
          <ReportDataTable
            headers={[
              "Menu item",
              { label: "Qty", thClassName: tableCenterColumnClass },
              { label: "Revenue", thClassName: tableCenterColumnClass },
              { label: "Cost", thClassName: tableCenterColumnClass },
              { label: "Profit", thClassName: tableCenterColumnClass },
              { label: "Margin", thClassName: tableCenterColumnClass },
            ]}
            mobileCards={
              <ListCardStack>
                {report.topProfitableItems.map((item) => (
                  <ListCard
                    key={item.menuItemId}
                    title={item.name}
                    fields={[
                      { label: "Qty", value: item.quantitySold },
                      { label: "Revenue", value: formatMoney(item.revenue) },
                      { label: "Cost", value: formatMoney(item.cost) },
                      { label: "Profit", value: formatMoney(item.profit) },
                      { label: "Margin", value: `${item.marginPercent}%` },
                    ]}
                  />
                ))}
              </ListCardStack>
            }
          >
            {report.topProfitableItems.map((item) => (
              <tr key={item.menuItemId}>
                <td className="font-medium">{item.name}</td>
                <td className={tableCenterCellClass}>{item.quantitySold}</td>
                <td className={cn(tableCenterCellClass, "font-mono tabular-nums")}>
                  {formatMoney(item.revenue)}
                </td>
                <td className={cn(tableCenterCellClass, "font-mono tabular-nums")}>
                  {formatMoney(item.cost)}
                </td>
                <td className={cn(tableCenterCellClass, "font-mono tabular-nums text-emerald-700 dark:text-emerald-400")}>
                  {formatMoney(item.profit)}
                </td>
                <td className={cn(tableCenterCellClass, "tabular-nums")}>{item.marginPercent}%</td>
              </tr>
            ))}
          </ReportDataTable>
        </ReportSection>
      ) : (
        <EmptyState title="No profit data in this period" description="Try widening the date range." />
      )}
    </ReportPageLayout>
  );
}

export default function ProfitReportPage() {
  return (
    <Suspense fallback={<ReportDetailSkeleton columns={6} />}>
      <ProfitReportContent />
    </Suspense>
  );
}

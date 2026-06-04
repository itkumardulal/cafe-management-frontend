"use client";

import { Suspense } from "react";
import { EmptyState } from "@/src/components/ui/empty-state";
import { ListCard, ListCardStack } from "@/src/components/shared/list-card";
import {
  ReportDataTable,
  ReportRankBadge,
} from "@/src/features/reports/components/report-data-table";
import {
  ReportSection,
  ReportSummaryCard,
  ReportSummaryStrip,
} from "@/src/features/reports/components/report-detail-shell";
import { ReportPageLayout } from "@/src/features/reports/components/report-page-layout";
import { ReportDetailSkeleton } from "@/src/features/reports/components/reports-skeleton";
import { useReportPeriodNavigation } from "@/src/features/reports/components/reports-hub-content";
import { useReportLoader } from "@/src/features/reports/hooks/use-report-loader";
import type { SalesReport } from "@/src/features/reports/types/reports.types";
import { cn } from "@/src/lib/cn";
import { formatMoney } from "@/src/lib/format-display";
import { operationsApi } from "@/src/services/operations-api";
import { tableCenterCellClass, tableCenterColumnClass } from "@/src/components/ui/table";

function SalesReportContent() {
  const { periodParams, effectivePeriodParams, setPeriodParams } = useReportPeriodNavigation();
  const { data: report, loading } = useReportLoader<SalesReport>(
    () => operationsApi.reports.sales(effectivePeriodParams),
    [effectivePeriodParams],
    "Failed to load sales report",
  );

  return (
    <ReportPageLayout
      slug="sales"
      periodParams={periodParams}
      onPeriodChange={setPeriodParams}
      periodLabel={report?.period.label}
      loading={loading}
      summary={
        report && !loading ? (
          <ReportSummaryStrip>
            <ReportSummaryCard
              label="Total sales"
              value={formatMoney(report.totalSales)}
              tone="positive"
            />
            <ReportSummaryCard label="Total orders" value={String(report.totalOrders)} tone="info" />
            <ReportSummaryCard
              label="Average order value"
              value={formatMoney(report.averageOrderValue)}
            />
            <ReportSummaryCard
              label="Discounts given"
              value={formatMoney(report.totalDiscountGiven)}
              hint="Bill-level discounts in period"
              tone="warning"
            />
          </ReportSummaryStrip>
        ) : null
      }
    >
      {loading ? (
        <ReportDetailSkeleton columns={4} />
      ) : report && report.topMenuItems.length > 0 ? (
        <ReportSection
          title="Top selling items"
          description="Ranked by quantity sold in the selected period."
          count={report.topMenuItems.length}
        >
          <ReportDataTable
            headers={[
              { label: "#", thClassName: tableCenterColumnClass },
              "Menu item",
              { label: "Qty sold", thClassName: tableCenterColumnClass },
              { label: "Revenue", thClassName: tableCenterColumnClass },
            ]}
            mobileCards={
              <ListCardStack>
                {report.topMenuItems.map((item, index) => (
                  <ListCard
                    key={item.menuItemId}
                    leading={<ReportRankBadge rank={index + 1} />}
                    title={item.name}
                    fields={[
                      { label: "Qty sold", value: item.quantitySold },
                      { label: "Revenue", value: formatMoney(item.revenue) },
                    ]}
                  />
                ))}
              </ListCardStack>
            }
          >
            {report.topMenuItems.map((item, index) => (
              <tr key={item.menuItemId}>
                <td className={tableCenterCellClass}>
                  <ReportRankBadge rank={index + 1} />
                </td>
                <td className="font-medium">{item.name}</td>
                <td className={tableCenterCellClass}>{item.quantitySold}</td>
                <td className={cn(tableCenterCellClass, "font-mono tabular-nums")}>
                  {formatMoney(item.revenue)}
                </td>
              </tr>
            ))}
          </ReportDataTable>
        </ReportSection>
      ) : (
        <EmptyState
          title="No sales in this period"
          description="Try widening the date range or confirm POS sales were recorded."
        />
      )}
    </ReportPageLayout>
  );
}

export default function SalesReportPage() {
  return (
    <Suspense fallback={<ReportDetailSkeleton columns={4} />}>
      <SalesReportContent />
    </Suspense>
  );
}

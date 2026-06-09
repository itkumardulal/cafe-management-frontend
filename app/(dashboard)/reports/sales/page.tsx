"use client";

import { Suspense, useMemo } from "react";
import { EmptyState } from "@/src/components/ui/empty-state";
import { ListCard, ListCardStack } from "@/src/components/shared/list-card";
import { ReportDataTable } from "@/src/features/reports/components/report-data-table";
import { ReportExportButton } from "@/src/features/reports/components/report-export-button";
import {
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
import {
  sumDecimalStrings,
  sumQuantityFromField,
} from "@/src/features/reports/lib/report-table-totals";
import type { SalesReport } from "@/src/features/reports/types/reports.types";
import { cn } from "@/src/lib/cn";
import { formatMoney } from "@/src/lib/format-display";
import { operationsApi } from "@/src/services/operations-api";
import { tableCenterCellClass, tableCenterColumnClass } from "@/src/components/ui/table";

const FOOTER_LABEL = "Total";

function SalesReportContent() {
  const { periodParams, effectivePeriodParams, setPeriodParams } = useReportPeriodNavigation();
  const { data: report, loading } = useReportLoader<SalesReport>(
    () => operationsApi.reports.sales(effectivePeriodParams),
    [effectivePeriodParams],
    "Failed to load sales report",
  );

  const items = report?.topMenuItems ?? [];
  const totals = useMemo(
    () => ({
      quantitySold: sumQuantityFromField(items, "quantitySold"),
      revenue: sumDecimalStrings(items.map((item) => item.revenue)),
    }),
    [items],
  );

  const getFooterRow = () => [
    FOOTER_LABEL,
    "—",
    totals.quantitySold,
    Number(totals.revenue),
  ];

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
      ) : report && items.length > 0 ? (
        <ReportSection
          title="Top selling items"
          description="Ranked by quantity sold in the selected period."
          count={items.length}
          action={
            <ReportExportButton
              fileName={buildReportExportFileName("sales", "top-items", report.period.label)}
              sheetName="Top items"
              mode="loaded"
              rows={items.map((item, index) => ({ ...item, rank: index + 1 }))}
              columns={[
                { header: "No.", getValue: (row) => row.rank },
                { header: "Menu item", getValue: (row) => row.name },
                { header: "Qty sold", getValue: (row) => Number(row.quantitySold) },
                { header: "Revenue", getValue: (row) => Number(row.revenue) },
              ]}
              getFooterRow={getFooterRow}
            />
          }
        >
          <ReportDataTable
            headers={[
              { label: "No.", thClassName: tableCenterColumnClass },
              "Menu item",
              { label: "Qty sold", thClassName: tableCenterColumnClass },
              { label: "Revenue", thClassName: tableCenterColumnClass },
            ]}
            mobileCards={
              <ListCardStack>
                {items.map((item, index) => (
                  <ListCard
                    key={item.menuItemId}
                    title={item.name}
                    fields={[
                      { label: "No.", value: String(index + 1) },
                      { label: "Qty sold", value: item.quantitySold },
                      { label: "Revenue", value: formatMoney(item.revenue) },
                    ]}
                  />
                ))}
                <ReportTableMobileTotalCard
                  label={FOOTER_LABEL}
                  fields={[
                    { label: "Qty sold", value: String(totals.quantitySold) },
                    { label: "Revenue", value: formatMoney(totals.revenue) },
                  ]}
                />
              </ListCardStack>
            }
            footer={
              <ReportTableFooterRow
                label={FOOTER_LABEL}
                cells={["—", totals.quantitySold, formatMoney(totals.revenue)]}
              />
            }
          >
            {items.map((item, index) => (
              <tr key={item.menuItemId}>
                <td className={cn(tableCenterCellClass, "tabular-nums text-muted")}>
                  {index + 1}
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

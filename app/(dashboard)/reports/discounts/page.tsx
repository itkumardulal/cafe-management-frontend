"use client";

import { Suspense, useMemo } from "react";
import { Badge } from "@/src/components/ui/badge";
import { EmptyState } from "@/src/components/ui/empty-state";
import { ListCard, ListCardStack } from "@/src/components/shared/list-card";
import { ReportDataTable } from "@/src/features/reports/components/report-data-table";
import { ReportExportButton } from "@/src/features/reports/components/report-export-button";
import {
  ReportSection,
  ReportSummaryCard,
  ReportSummaryStrip,
} from "@/src/features/reports/components/report-detail-shell";
import { ReportStaffLeaderboard } from "@/src/features/reports/components/report-staff-leaderboard";
import { ReportTableFooterRow } from "@/src/features/reports/components/report-table-footer-row";
import { ReportTableMobileTotalCard } from "@/src/features/reports/components/report-table-mobile-total-card";
import { ReportPageLayout } from "@/src/features/reports/components/report-page-layout";
import { ReportDetailSkeleton } from "@/src/features/reports/components/reports-skeleton";
import { useReportPeriodNavigation } from "@/src/features/reports/components/reports-hub-content";
import { useReportLoader } from "@/src/features/reports/hooks/use-report-loader";
import { buildReportExportFileName } from "@/src/features/reports/lib/build-report-export-file-name";
import { sumDecimalStrings } from "@/src/features/reports/lib/report-table-totals";
import type { DiscountReport } from "@/src/features/reports/types/reports.types";
import { cn } from "@/src/lib/cn";
import { formatDateOnly, formatMoney } from "@/src/lib/format-display";
import { operationsApi } from "@/src/services/operations-api";
import { tableCenterCellClass, tableCenterColumnClass } from "@/src/components/ui/table";

const FOOTER_LABEL = "Total";

function DiscountReportContent() {
  const { periodParams, effectivePeriodParams, setPeriodParams } = useReportPeriodNavigation();
  const { data: report, loading } = useReportLoader<DiscountReport>(
    () => operationsApi.reports.discounts({ ...effectivePeriodParams, page: 1, limit: 50 }),
    [effectivePeriodParams],
    "Failed to load discount report",
  );

  const discountPct = Number(report?.summary.discountAsPercentOfSales ?? 0);
  const items = report?.items ?? [];
  const totals = useMemo(
    () => ({
      discount: sumDecimalStrings(items.map((item) => item.discountAmount)),
      billTotal: sumDecimalStrings(items.map((item) => item.grandTotal)),
    }),
    [items],
  );

  return (
    <ReportPageLayout
      slug="discounts"
      periodParams={periodParams}
      onPeriodChange={setPeriodParams}
      periodLabel={report?.period.label}
      loading={loading}
      summary={
        report && !loading ? (
          <>
            <ReportSummaryStrip>
              <ReportSummaryCard
                label="Total discount"
                value={formatMoney(report.summary.totalDiscountAmount)}
                tone="warning"
              />
              <ReportSummaryCard
                label="% of sales"
                value={`${report.summary.discountAsPercentOfSales}%`}
                tone={discountPct > 10 ? "negative" : discountPct > 5 ? "warning" : "neutral"}
              />
              <ReportSummaryCard
                label="Discount bills"
                value={String(report.summary.discountTransactionCount)}
                tone="info"
              />
              <ReportSummaryCard
                label="Period sales"
                value={formatMoney(report.summary.periodSales)}
                tone="positive"
              />
            </ReportSummaryStrip>
            <ReportStaffLeaderboard
              staff={report.summaryByStaff}
              totalDiscount={report.summary.totalDiscountAmount}
            />
          </>
        ) : null
      }
    >
      {loading ? (
        <ReportDetailSkeleton columns={5} />
      ) : report && items.length > 0 ? (
        <ReportSection
          title="Discount transactions"
          description="Every bill with a discount applied."
          count={report.meta.total}
          action={
            <ReportExportButton
              fileName={buildReportExportFileName("discounts", "transactions", report.period.label)}
              sheetName="Discounts"
              mode="fetchAll"
              fetchAllPages={async (page, limit) => {
                const data = await operationsApi.reports.discounts({
                  ...effectivePeriodParams,
                  page,
                  limit,
                });
                return { items: data.items, total: data.meta.total };
              }}
              columns={[
                { header: "Receipt", getValue: (row) => row.receiptNo },
                { header: "Date", getValue: (row) => formatDateOnly(row.saleAt) },
                { header: "Staff", getValue: (row) => row.staff?.fullName ?? "Unknown" },
                { header: "Discount", getValue: (row) => Number(row.discountAmount) },
                { header: "Bill total", getValue: (row) => Number(row.grandTotal) },
              ]}
              getFooterRow={(rows) => [
                "Total",
                "",
                "",
                Number(sumDecimalStrings(rows.map((row) => row.discountAmount))),
                Number(sumDecimalStrings(rows.map((row) => row.grandTotal))),
              ]}
            />
          }
        >
          <ReportDataTable
            headers={[
              "Receipt",
              { label: "Date", thClassName: tableCenterColumnClass },
              "Staff",
              { label: "Discount", thClassName: tableCenterColumnClass },
              { label: "Bill total", thClassName: tableCenterColumnClass },
            ]}
            mobileCards={
              <ListCardStack>
                {items.map((item) => (
                  <ListCard
                    key={item.id}
                    title={item.receiptNo}
                    subtitle={formatDateOnly(item.saleAt)}
                    badge={
                      <Badge variant="warning" size="sm">
                        {formatMoney(item.discountAmount)}
                      </Badge>
                    }
                    fields={[
                      { label: "Staff", value: item.staff?.fullName ?? "Unknown" },
                      { label: "Bill total", value: formatMoney(item.grandTotal) },
                    ]}
                  />
                ))}
                <ReportTableMobileTotalCard
                  label={FOOTER_LABEL}
                  fields={[
                    { label: "Discount", value: formatMoney(totals.discount) },
                    { label: "Bill total", value: formatMoney(totals.billTotal) },
                  ]}
                />
              </ListCardStack>
            }
            footer={
              <ReportTableFooterRow
                label={FOOTER_LABEL}
                cells={[
                  "—",
                  "—",
                  formatMoney(totals.discount),
                  formatMoney(totals.billTotal),
                ]}
              />
            }
          >
            {items.map((item) => (
              <tr key={item.id}>
                <td className="font-mono text-sm">{item.receiptNo}</td>
                <td className={tableCenterCellClass}>{formatDateOnly(item.saleAt)}</td>
                <td>{item.staff?.fullName ?? "Unknown"}</td>
                <td className={cn(tableCenterCellClass, "font-mono tabular-nums text-[var(--color-nav-active-text)]")}>
                  {formatMoney(item.discountAmount)}
                </td>
                <td className={cn(tableCenterCellClass, "font-mono tabular-nums")}>
                  {formatMoney(item.grandTotal)}
                </td>
              </tr>
            ))}
          </ReportDataTable>
        </ReportSection>
      ) : (
        <EmptyState title="No discounts in this period" description="No bills with discounts were found." />
      )}
    </ReportPageLayout>
  );
}

export default function DiscountReportPage() {
  return (
    <Suspense fallback={<ReportDetailSkeleton columns={5} />}>
      <DiscountReportContent />
    </Suspense>
  );
}

"use client";

import { Suspense } from "react";
import { Badge } from "@/src/components/ui/badge";
import { EmptyState } from "@/src/components/ui/empty-state";
import { ListCard, ListCardStack } from "@/src/components/shared/list-card";
import { ReportDataTable } from "@/src/features/reports/components/report-data-table";
import {
  ReportSection,
  ReportSummaryCard,
  ReportSummaryStrip,
} from "@/src/features/reports/components/report-detail-shell";
import { ReportPageLayout } from "@/src/features/reports/components/report-page-layout";
import { ReportStaffLeaderboard } from "@/src/features/reports/components/report-staff-leaderboard";
import { ReportDetailSkeleton } from "@/src/features/reports/components/reports-skeleton";
import { useReportPeriodNavigation } from "@/src/features/reports/components/reports-hub-content";
import { useReportLoader } from "@/src/features/reports/hooks/use-report-loader";
import type { DiscountReport } from "@/src/features/reports/types/reports.types";
import { cn } from "@/src/lib/cn";
import { formatDateOnly, formatMoney } from "@/src/lib/format-display";
import { operationsApi } from "@/src/services/operations-api";
import { tableCenterCellClass, tableCenterColumnClass } from "@/src/components/ui/table";

function DiscountReportContent() {
  const { periodParams, effectivePeriodParams, setPeriodParams } = useReportPeriodNavigation();
  const { data: report, loading } = useReportLoader<DiscountReport>(
    () => operationsApi.reports.discounts({ ...effectivePeriodParams, page: 1, limit: 50 }),
    [effectivePeriodParams],
    "Failed to load discount report",
  );

  const discountPct = Number(report?.summary.discountAsPercentOfSales ?? 0);

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
      ) : report && report.items.length > 0 ? (
        <ReportSection
          title="Discount transactions"
          description="Every bill with a discount applied."
          count={report.meta.total}
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
                {report.items.map((item) => (
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
              </ListCardStack>
            }
          >
            {report.items.map((item) => (
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

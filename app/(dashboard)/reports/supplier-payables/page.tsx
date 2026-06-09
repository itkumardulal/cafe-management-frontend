"use client";

import { Suspense, useMemo } from "react";
import { Badge } from "@/src/components/ui/badge";
import { EmptyState } from "@/src/components/ui/empty-state";
import { ListCard, ListCardStack } from "@/src/components/shared/list-card";
import { ReportDataTable } from "@/src/features/reports/components/report-data-table";
import { ReportExportButton } from "@/src/features/reports/components/report-export-button";
import {
  buildAgingBuckets,
  ReportAgingGrid,
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
import type { SupplierPayableReport } from "@/src/features/reports/types/reports.types";
import { cn } from "@/src/lib/cn";
import { formatDateOnly, formatMoney } from "@/src/lib/format-display";
import { operationsApi } from "@/src/services/operations-api";
import { tableCenterCellClass, tableCenterColumnClass } from "@/src/components/ui/table";

const FOOTER_LABEL = "Total";

function SupplierPayableReportContent() {
  const { periodParams, effectivePeriodParams, setPeriodParams } = useReportPeriodNavigation();
  const { data: report, loading } = useReportLoader<SupplierPayableReport>(
    () => operationsApi.reports.supplierPayables({ ...effectivePeriodParams, page: 1, limit: 50 }),
    [effectivePeriodParams],
    "Failed to load payables report",
  );

  const overdue = Number(report?.summary.overdueBillsAmount ?? 0);
  const agingTotals = report?.aging.totals ?? {};
  const outstandingItems = report?.outstandingBills.items ?? [];
  const paymentItems = report?.paymentHistory ?? [];

  const outstandingTotals = useMemo(
    () => ({
      remaining: sumDecimalStrings(outstandingItems.map((bill) => bill.remainingAmount)),
    }),
    [outstandingItems],
  );

  const paymentTotals = useMemo(
    () => ({
      amount: sumDecimalStrings(paymentItems.map((payment) => payment.amount)),
    }),
    [paymentItems],
  );

  return (
    <ReportPageLayout
      slug="supplier-payables"
      periodParams={periodParams}
      onPeriodChange={setPeriodParams}
      periodLabel={report?.period.label}
      snapshotNote={report?.snapshotNote}
      loading={loading}
      summary={
        report && !loading ? (
          <>
            <ReportSummaryStrip>
              <ReportSummaryCard
                label="Outstanding"
                value={formatMoney(report.summary.outstandingBillsAmount)}
                tone="warning"
              />
              <ReportSummaryCard
                label="Overdue"
                value={formatMoney(report.summary.overdueBillsAmount)}
                tone={overdue > 0 ? "negative" : "positive"}
              />
              <ReportSummaryCard
                label="Due this week"
                value={formatMoney(report.summary.billsDueThisWeekAmount)}
                tone="info"
              />
              <ReportSummaryCard
                label="Suppliers with dues"
                value={String(report.summary.suppliersWithOutstandingCount)}
              />
            </ReportSummaryStrip>
            <ReportSection title="Aging summary" description="Outstanding payables by days past due.">
              <ReportAgingGrid
                buckets={buildAgingBuckets(
                  {
                    current: agingTotals.current ?? 0,
                    days1_30: agingTotals.days1_30 ?? 0,
                    days31_60: agingTotals.days31_60 ?? 0,
                    days61_90: agingTotals.days61_90 ?? 0,
                    days90Plus: agingTotals.days90Plus ?? 0,
                  },
                  formatMoney,
                )}
              />
            </ReportSection>
          </>
        ) : null
      }
    >
      {loading ? (
        <ReportDetailSkeleton columns={5} />
      ) : report ? (
        <div className="space-y-6">
          <ReportSection
            title="Outstanding bills"
            description="Unpaid supplier bills sorted by due date."
            count={report.outstandingBills.meta.total}
            action={
              outstandingItems.length > 0 ? (
                <ReportExportButton
                  fileName={buildReportExportFileName(
                    "supplier-payables",
                    "outstanding-bills",
                    report.period.label,
                  )}
                  sheetName="Outstanding"
                  mode="fetchAll"
                  fetchAllPages={async (page, limit) => {
                    const data = await operationsApi.reports.supplierPayables({
                      ...effectivePeriodParams,
                      page,
                      limit,
                    });
                    return {
                      items: data.outstandingBills.items,
                      total: data.outstandingBills.meta.total,
                    };
                  }}
                  columns={[
                    { header: "Receipt", getValue: (row) => row.receiptNo },
                    { header: "Supplier", getValue: (row) => row.supplierName },
                    {
                      header: "Due date",
                      getValue: (row) => (row.dueDate ? formatDateOnly(row.dueDate) : "—"),
                    },
                    { header: "Remaining", getValue: (row) => Number(row.remainingAmount) },
                    {
                      header: "Status",
                      getValue: (row) => (row.isOverdue ? "Overdue" : row.billStatus),
                    },
                  ]}
                  getFooterRow={(rows) => [
                    "Total",
                    "",
                    "",
                    Number(sumDecimalStrings(rows.map((row) => row.remainingAmount))),
                    "",
                  ]}
                />
              ) : undefined
            }
          >
            {outstandingItems.length > 0 ? (
              <ReportDataTable
                headers={[
                  "Receipt",
                  "Supplier",
                  { label: "Due date", thClassName: tableCenterColumnClass },
                  { label: "Remaining", thClassName: tableCenterColumnClass },
                  { label: "Status", thClassName: tableCenterColumnClass },
                ]}
                mobileCards={
                  <ListCardStack>
                    {outstandingItems.map((bill) => (
                      <ListCard
                        key={bill.id}
                        title={bill.receiptNo}
                        subtitle={bill.supplierName}
                        badge={
                          <Badge variant={bill.isOverdue ? "danger" : "default"} size="sm">
                            {bill.isOverdue ? "Overdue" : bill.billStatus}
                          </Badge>
                        }
                        fields={[
                          {
                            label: "Due date",
                            value: bill.dueDate ? formatDateOnly(bill.dueDate) : "—",
                          },
                          { label: "Remaining", value: formatMoney(bill.remainingAmount) },
                        ]}
                      />
                    ))}
                    <ReportTableMobileTotalCard
                      label={FOOTER_LABEL}
                      fields={[
                        { label: "Remaining", value: formatMoney(outstandingTotals.remaining) },
                      ]}
                    />
                  </ListCardStack>
                }
                footer={
                  <ReportTableFooterRow
                    label={FOOTER_LABEL}
                    cells={["—", "—", formatMoney(outstandingTotals.remaining), "—"]}
                  />
                }
              >
                {outstandingItems.map((bill) => (
                  <tr key={bill.id}>
                    <td className="font-mono text-sm">{bill.receiptNo}</td>
                    <td>{bill.supplierName}</td>
                    <td className={tableCenterCellClass}>
                      {bill.dueDate ? formatDateOnly(bill.dueDate) : "—"}
                    </td>
                    <td className={cn(tableCenterCellClass, "font-mono tabular-nums")}>
                      {formatMoney(bill.remainingAmount)}
                    </td>
                    <td className={tableCenterCellClass}>
                      <Badge variant={bill.isOverdue ? "danger" : "default"} size="sm">
                        {bill.isOverdue ? "Overdue" : bill.billStatus}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </ReportDataTable>
            ) : (
              <EmptyState title="No outstanding bills" description="All supplier bills are settled." />
            )}
          </ReportSection>

          <ReportSection
            title="Payment history"
            description="Supplier payments recorded during the selected period."
            count={paymentItems.length}
            action={
              paymentItems.length > 0 ? (
                <ReportExportButton
                  fileName={buildReportExportFileName(
                    "supplier-payables",
                    "payments",
                    report.period.label,
                  )}
                  sheetName="Payments"
                  mode="loaded"
                  rows={paymentItems}
                  columns={[
                    { header: "Date", getValue: (row) => formatDateOnly(row.paymentDate) },
                    { header: "Supplier", getValue: (row) => row.supplierName },
                    { header: "Purchase", getValue: (row) => row.purchaseReceiptNo },
                    { header: "Amount", getValue: (row) => Number(row.amount) },
                    { header: "Method", getValue: (row) => row.paymentMethod },
                  ]}
                  getFooterRow={(rows) => [
                    "Total",
                    "",
                    "",
                    Number(sumDecimalStrings(rows.map((row) => row.amount))),
                    "",
                  ]}
                />
              ) : undefined
            }
          >
            {paymentItems.length > 0 ? (
              <ReportDataTable
                headers={[
                  { label: "Date", thClassName: tableCenterColumnClass },
                  "Supplier",
                  "Purchase",
                  { label: "Amount", thClassName: tableCenterColumnClass },
                  { label: "Method", thClassName: tableCenterColumnClass },
                ]}
                mobileCards={
                  <ListCardStack>
                    {paymentItems.map((p) => (
                      <ListCard
                        key={p.id}
                        title={p.supplierName}
                        subtitle={formatDateOnly(p.paymentDate)}
                        fields={[
                          { label: "Purchase", value: p.purchaseReceiptNo },
                          { label: "Amount", value: formatMoney(p.amount) },
                          { label: "Method", value: p.paymentMethod },
                        ]}
                      />
                    ))}
                    <ReportTableMobileTotalCard
                      fields={[{ label: "Amount", value: formatMoney(paymentTotals.amount) }]}
                    />
                  </ListCardStack>
                }
                footer={
                  <ReportTableFooterRow
                    cells={["—", "—", formatMoney(paymentTotals.amount), "—"]}
                  />
                }
              >
                {paymentItems.map((p) => (
                  <tr key={p.id}>
                    <td className={tableCenterCellClass}>{formatDateOnly(p.paymentDate)}</td>
                    <td>{p.supplierName}</td>
                    <td className="font-mono text-sm">{p.purchaseReceiptNo}</td>
                    <td className={cn(tableCenterCellClass, "font-mono tabular-nums")}>
                      {formatMoney(p.amount)}
                    </td>
                    <td className={tableCenterCellClass}>{p.paymentMethod}</td>
                  </tr>
                ))}
              </ReportDataTable>
            ) : (
              <EmptyState title="No payments in period" description="No supplier payments in this period." />
            )}
          </ReportSection>
        </div>
      ) : null}
    </ReportPageLayout>
  );
}

export default function SupplierPayableReportPage() {
  return (
    <Suspense fallback={<ReportDetailSkeleton columns={5} />}>
      <SupplierPayableReportContent />
    </Suspense>
  );
}

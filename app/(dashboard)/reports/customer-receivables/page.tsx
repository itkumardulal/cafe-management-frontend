"use client";

import { Suspense, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/src/components/ui/button";
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
import { useReportLoader } from "@/src/features/reports/hooks/use-report-loader";
import { buildReportExportFileName } from "@/src/features/reports/lib/build-report-export-file-name";
import { sumDecimalStrings, sumNumbers } from "@/src/features/reports/lib/report-table-totals";
import type { CustomerReceivableReport } from "@/src/features/reports/types/reports.types";
import { cn } from "@/src/lib/cn";
import { formatDateOnly, formatMoney } from "@/src/lib/format-display";
import { operationsApi } from "@/src/services/operations-api";
import {
  tableActionsCellClass,
  tableActionsColumnClass,
  tableCenterCellClass,
  tableCenterColumnClass,
} from "@/src/components/ui/table";

const FOOTER_LABEL = "Total";

function CustomerReceivableReportContent() {
  const { data: report, loading } = useReportLoader<CustomerReceivableReport>(
    () => operationsApi.reports.customerReceivables({ page: 1, limit: 50 }),
    [],
    "Failed to load receivables report",
  );

  const items = report?.items ?? [];
  const totals = useMemo(
    () => ({
      outstanding: sumDecimalStrings(items.map((item) => item.outstandingAmount)),
      unpaidBills: sumNumbers(items.map((item) => item.unpaidBillCount)),
    }),
    [items],
  );

  return (
    <ReportPageLayout
      slug="customer-receivables"
      showPeriodFilter={false}
      snapshotNote={report?.snapshotNote}
      loading={loading}
      summary={
        report && !loading ? (
          <>
            <ReportSummaryStrip>
              <ReportSummaryCard
                label="Total outstanding"
                value={formatMoney(report.summary.totalOutstanding)}
                tone="warning"
              />
              <ReportSummaryCard
                label="Customers with credit"
                value={String(report.summary.customersWithCredit)}
                tone="info"
              />
            </ReportSummaryStrip>
            <ReportSection title="Aging summary" description="Outstanding amounts by days past due.">
              <ReportAgingGrid
                buckets={buildAgingBuckets(report.aging, formatMoney)}
              />
            </ReportSection>
          </>
        ) : null
      }
    >
      {loading ? (
        <ReportDetailSkeleton columns={5} />
      ) : report && items.length > 0 ? (
        <ReportSection
          title="Customers owing money"
          description="Sorted by highest outstanding balance."
          count={report.meta.total}
          action={
            <ReportExportButton
              fileName={buildReportExportFileName("customer-receivables", "customers")}
              sheetName="Receivables"
              mode="fetchAll"
              fetchAllPages={async (page, limit) => {
                const data = await operationsApi.reports.customerReceivables({ page, limit });
                return { items: data.items, total: data.meta.total };
              }}
              columns={[
                { header: "Customer", getValue: (row) => row.name },
                { header: "Phone", getValue: (row) => row.phoneNumber },
                { header: "Outstanding", getValue: (row) => Number(row.outstandingAmount) },
                { header: "Unpaid bills", getValue: (row) => row.unpaidBillCount },
                {
                  header: "Last payment",
                  getValue: (row) => (row.lastPaymentDate ? formatDateOnly(row.lastPaymentDate) : "—"),
                },
              ]}
              getFooterRow={(rows) => [
                "Total",
                "",
                Number(sumDecimalStrings(rows.map((row) => row.outstandingAmount))),
                sumNumbers(rows.map((row) => row.unpaidBillCount)),
                "",
              ]}
            />
          }
        >
          <ReportDataTable
            headers={[
              "Customer",
              { label: "Outstanding", thClassName: tableCenterColumnClass },
              { label: "Unpaid bills", thClassName: tableCenterColumnClass },
              { label: "Last payment", thClassName: tableCenterColumnClass },
              {
                label: "Actions",
                thClassName: cn(tableActionsColumnClass, "w-[1%] whitespace-nowrap"),
              },
            ]}
            mobileCards={
              <ListCardStack>
                {items.map((item) => (
                  <ListCard
                    key={item.customerId}
                    title={item.name}
                    subtitle={item.phoneNumber}
                    fields={[
                      { label: "Outstanding", value: formatMoney(item.outstandingAmount) },
                      { label: "Unpaid bills", value: String(item.unpaidBillCount) },
                      {
                        label: "Last payment",
                        value: item.lastPaymentDate ? formatDateOnly(item.lastPaymentDate) : "—",
                      },
                    ]}
                    actions={
                      <Link href={`/customer-receivables/${item.customerId}`}>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="!min-h-0 h-8 px-3 py-1.5"
                        >
                          Collect
                        </Button>
                      </Link>
                    }
                  />
                ))}
                <ReportTableMobileTotalCard
                  label={FOOTER_LABEL}
                  fields={[
                    { label: "Outstanding", value: formatMoney(totals.outstanding) },
                    { label: "Unpaid bills", value: String(totals.unpaidBills) },
                  ]}
                />
              </ListCardStack>
            }
            footer={
              <ReportTableFooterRow
                label={FOOTER_LABEL}
                cells={[
                  formatMoney(totals.outstanding),
                  totals.unpaidBills,
                  "—",
                  "—",
                ]}
              />
            }
          >
            {items.map((item) => (
              <tr key={item.customerId}>
                <td>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-muted">{item.phoneNumber}</p>
                </td>
                <td className={cn(tableCenterCellClass, "font-mono tabular-nums")}>
                  {formatMoney(item.outstandingAmount)}
                </td>
                <td className={tableCenterCellClass}>{item.unpaidBillCount}</td>
                <td className={tableCenterCellClass}>
                  {item.lastPaymentDate ? formatDateOnly(item.lastPaymentDate) : "—"}
                </td>
                <td className="whitespace-nowrap">
                  <div className={tableActionsCellClass}>
                    <Link href={`/customer-receivables/${item.customerId}`} className="inline-flex">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="!min-h-0 h-8 shrink-0 px-3 py-1.5"
                      >
                        Collect
                      </Button>
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </ReportDataTable>
        </ReportSection>
      ) : (
        <EmptyState
          title="No outstanding receivables"
          description="All customer balances are settled."
        />
      )}
    </ReportPageLayout>
  );
}

export default function CustomerReceivableReportPage() {
  return (
    <Suspense fallback={<ReportDetailSkeleton columns={6} />}>
      <CustomerReceivableReportContent />
    </Suspense>
  );
}

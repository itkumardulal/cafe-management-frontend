"use client";

import { Suspense } from "react";
import Link from "next/link";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { EmptyState } from "@/src/components/ui/empty-state";
import { ListCard, ListCardStack } from "@/src/components/shared/list-card";
import { ReportDataTable } from "@/src/features/reports/components/report-data-table";
import {
  buildAgingBuckets,
  ReportAgingGrid,
  ReportSection,
  ReportSummaryCard,
  ReportSummaryStrip,
} from "@/src/features/reports/components/report-detail-shell";
import { ReportPageLayout } from "@/src/features/reports/components/report-page-layout";
import { ReportDetailSkeleton } from "@/src/features/reports/components/reports-skeleton";
import { useReportLoader } from "@/src/features/reports/hooks/use-report-loader";
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

function CustomerReceivableReportContent() {
  const { data: report, loading } = useReportLoader<CustomerReceivableReport>(
    () => operationsApi.reports.customerReceivables({ page: 1, limit: 50 }),
    [],
    "Failed to load receivables report",
  );

  const overdue = Number(report?.summary.overdueAmount ?? 0);

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
                label="Overdue"
                value={formatMoney(report.summary.overdueAmount)}
                tone={overdue > 0 ? "negative" : "positive"}
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
        <ReportDetailSkeleton columns={6} />
      ) : report && report.items.length > 0 ? (
        <ReportSection
          title="Customers owing money"
          description="Sorted by highest outstanding balance."
          count={report.meta.total}
        >
          <ReportDataTable
            headers={[
              "Customer",
              { label: "Outstanding", thClassName: tableCenterColumnClass },
              { label: "Unpaid bills", thClassName: tableCenterColumnClass },
              { label: "Overdue", thClassName: tableCenterColumnClass },
              { label: "Last payment", thClassName: tableCenterColumnClass },
              { label: "Actions", thClassName: tableActionsColumnClass },
            ]}
            mobileCards={
              <ListCardStack>
                {report.items.map((item) => (
                  <ListCard
                    key={item.customerId}
                    title={item.name}
                    subtitle={item.phoneNumber}
                    badge={
                      Number(item.overdueAmount) > 0 ? (
                        <Badge variant="danger" size="sm">
                          Overdue {formatMoney(item.overdueAmount)}
                        </Badge>
                      ) : undefined
                    }
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
                        <Button type="button" size="sm" variant="secondary">
                          Collect
                        </Button>
                      </Link>
                    }
                  />
                ))}
              </ListCardStack>
            }
          >
            {report.items.map((item) => (
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
                  {Number(item.overdueAmount) > 0 ? (
                    <Badge variant="danger" size="sm">
                      {formatMoney(item.overdueAmount)}
                    </Badge>
                  ) : (
                    "—"
                  )}
                </td>
                <td className={tableCenterCellClass}>
                  {item.lastPaymentDate ? formatDateOnly(item.lastPaymentDate) : "—"}
                </td>
                <td className={tableActionsCellClass}>
                  <Link href={`/customer-receivables/${item.customerId}`}>
                    <Button type="button" size="sm" variant="secondary">
                      Collect
                    </Button>
                  </Link>
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

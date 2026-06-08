"use client";

import Link from "next/link";
import { Suspense } from "react";
import { Badge } from "@/src/components/ui/badge";
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
import type { BankReport } from "@/src/features/reports/types/reports.types";
import { cn } from "@/src/lib/cn";
import { formatDateOnly, formatMoney } from "@/src/lib/format-display";
import { operationsApi } from "@/src/services/operations-api";
import { tableCenterCellClass, tableCenterColumnClass } from "@/src/components/ui/table";

function BankBalancesReportContent() {
  const { periodParams, effectivePeriodParams, setPeriodParams } = useReportPeriodNavigation();
  const { data: report, loading } = useReportLoader<BankReport>(
    () => operationsApi.reports.banks({ ...effectivePeriodParams, page: 1, limit: 50 }),
    [effectivePeriodParams],
    "Failed to load bank balances report",
  );

  const netChange = Number(report?.summary.netChangeInPeriod ?? 0);

  const typeBadge = (type: "DEPOSIT" | "WITHDRAWAL") => (
    <Badge size="sm" variant={type === "DEPOSIT" ? "success" : "danger"}>
      {type === "DEPOSIT" ? "Deposit" : "Withdrawal"}
    </Badge>
  );

  return (
    <ReportPageLayout
      slug="banks"
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
                label="Total current balance"
                value={formatMoney(report.summary.totalCurrentBalance)}
                hint="Live · all accounts"
                tone="info"
              />
              <ReportSummaryCard
                label="Active accounts"
                value={String(report.summary.activeAccountCount)}
              />
              <ReportSummaryCard
                label="Period deposits"
                value={formatMoney(report.summary.totalDepositsInPeriod)}
                hint={report.period.label}
              />
              <ReportSummaryCard
                label="Period withdrawals"
                value={formatMoney(report.summary.totalWithdrawalsInPeriod)}
                hint={report.period.label}
                tone="warning"
              />
              <ReportSummaryCard
                label="Net change"
                value={formatMoney(report.summary.netChangeInPeriod)}
                hint={report.period.label}
                tone={netChange >= 0 ? "positive" : "negative"}
              />
            </ReportSummaryStrip>
            <ReportInsightCard title="How to read this report">
              <strong>Current balance</strong> is live as of today across all bank accounts.{" "}
              <strong>Period deposits and withdrawals</strong> cover only the selected date range.
              POS and purchase bank payments are recorded separately — mirror significant movements in{" "}
              <Link href="/bank-transactions" className="font-medium underline underline-offset-2">
                Bank transactions
              </Link>
              . Manage accounts in{" "}
              <Link href="/banks" className="font-medium underline underline-offset-2">
                Banks
              </Link>
              .
            </ReportInsightCard>
          </>
        ) : null
      }
    >
      {loading ? (
        <ReportDetailSkeleton columns={6} />
      ) : report ? (
        <div className="space-y-6">
          <ReportSection
            title="Account balances"
            description="Opening balance, period movement, and current balance per account."
            count={report.accounts.length}
          >
            {report.accounts.length > 0 ? (
              <ReportDataTable
                headers={[
                  "Bank",
                  { label: "Account #", thClassName: tableCenterColumnClass },
                  { label: "Status", thClassName: tableCenterColumnClass },
                  { label: "Opening", thClassName: tableCenterColumnClass },
                  { label: "At period start", thClassName: tableCenterColumnClass },
                  { label: "Period in", thClassName: tableCenterColumnClass },
                  { label: "Period out", thClassName: tableCenterColumnClass },
                  { label: "Current (live)", thClassName: tableCenterColumnClass },
                ]}
                mobileCards={
                  <ListCardStack>
                    {report.accounts.map((account) => (
                      <ListCard
                        key={account.id}
                        title={account.bankName}
                        subtitle={account.accountNumber}
                        badge={
                          <Badge size="sm" variant={account.isActive ? "success" : "default"}>
                            {account.isActive ? "Active" : "Inactive"}
                          </Badge>
                        }
                        fields={[
                          { label: "Opening", value: formatMoney(account.openingBalance) },
                          {
                            label: "At period start",
                            value: formatMoney(account.balanceAtPeriodStart),
                          },
                          { label: "Period in", value: formatMoney(account.periodDeposits) },
                          { label: "Period out", value: formatMoney(account.periodWithdrawals) },
                          { label: "Current", value: formatMoney(account.currentBalance) },
                        ]}
                      />
                    ))}
                  </ListCardStack>
                }
              >
                {report.accounts.map((account) => (
                  <tr key={account.id}>
                    <td>
                      <div className="font-medium">{account.bankName}</div>
                      <div className="text-xs text-muted">{account.accountHolderName}</div>
                    </td>
                    <td className={cn(tableCenterCellClass, "font-mono text-sm text-muted")}>
                      {account.accountNumber}
                    </td>
                    <td className={tableCenterCellClass}>
                      <Badge size="sm" variant={account.isActive ? "success" : "default"}>
                        {account.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className={cn(tableCenterCellClass, "tabular-nums text-muted")}>
                      {formatMoney(account.openingBalance)}
                    </td>
                    <td className={cn(tableCenterCellClass, "tabular-nums text-muted")}>
                      {formatMoney(account.balanceAtPeriodStart)}
                    </td>
                    <td className={cn(tableCenterCellClass, "tabular-nums text-emerald-700 dark:text-emerald-300")}>
                      {formatMoney(account.periodDeposits)}
                    </td>
                    <td className={cn(tableCenterCellClass, "tabular-nums text-red-700 dark:text-red-300")}>
                      {formatMoney(account.periodWithdrawals)}
                    </td>
                    <td className={cn(tableCenterCellClass, "font-medium tabular-nums")}>
                      {formatMoney(account.currentBalance)}
                    </td>
                  </tr>
                ))}
              </ReportDataTable>
            ) : (
              <div className="space-y-3">
                <EmptyState
                  title="No bank accounts"
                  description="Add bank accounts to track balances and record deposits and withdrawals."
                />
                <p className="text-center text-sm">
                  <Link href="/banks" className="font-medium underline underline-offset-2">
                    Go to Banks
                  </Link>
                </p>
              </div>
            )}
          </ReportSection>

          <ReportSection
            title="Transactions in period"
            description="Deposits and withdrawals recorded during the selected period."
            count={report.transactions.meta.total}
          >
            {report.transactions.items.length > 0 ? (
              <ReportDataTable
                headers={[
                  { label: "Date", thClassName: tableCenterColumnClass },
                  "Bank account",
                  { label: "Type", thClassName: tableCenterColumnClass },
                  { label: "Amount", thClassName: tableCenterColumnClass },
                  "Reference",
                  "Voucher",
                  "Recorded by",
                ]}
                mobileCards={
                  <ListCardStack>
                    {report.transactions.items.map((row) => (
                      <ListCard
                        key={row.id}
                        title={`${row.bankName} · ${row.accountNumber}`}
                        subtitle={formatDateOnly(row.transactionDate)}
                        badge={typeBadge(row.type)}
                        fields={[
                          { label: "Amount", value: formatMoney(row.amount) },
                          { label: "Reference", value: row.referenceNumber?.trim() || "—" },
                          { label: "Recorded by", value: row.createdByName ?? "—" },
                        ]}
                      />
                    ))}
                  </ListCardStack>
                }
              >
                {report.transactions.items.map((row) => (
                  <tr key={row.id}>
                    <td className={cn(tableCenterCellClass, "whitespace-nowrap text-muted")}>
                      {formatDateOnly(row.transactionDate)}
                    </td>
                    <td>
                      <div className="font-medium">{row.bankName}</div>
                      <div className="font-mono text-xs text-muted">{row.accountNumber}</div>
                    </td>
                    <td className={tableCenterCellClass}>{typeBadge(row.type)}</td>
                    <td className={cn(tableCenterCellClass, "font-medium tabular-nums")}>
                      {formatMoney(row.amount)}
                    </td>
                    <td className="text-sm text-muted">{row.referenceNumber?.trim() || "—"}</td>
                    <td className="text-sm">
                      {row.proofAttachmentUrl ? (
                        <a
                          href={row.proofAttachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 underline underline-offset-2"
                        >
                          <img
                            src={row.proofAttachmentUrl}
                            alt="Voucher"
                            className="h-8 w-8 rounded object-cover"
                          />
                          View
                        </a>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="text-sm text-muted">{row.createdByName ?? "—"}</td>
                  </tr>
                ))}
              </ReportDataTable>
            ) : (
              <EmptyState
                title="No bank transactions in period"
                description="No deposits or withdrawals were recorded for the selected date range."
              />
            )}
          </ReportSection>
        </div>
      ) : null}
    </ReportPageLayout>
  );
}

export default function BankBalancesReportPage() {
  return (
    <Suspense fallback={<ReportDetailSkeleton columns={6} />}>
      <BankBalancesReportContent />
    </Suspense>
  );
}

"use client";

import Link from "next/link";
import { Suspense, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/src/components/ui/badge";
import { EmptyState } from "@/src/components/ui/empty-state";
import {
  ALL_BANKS_FILTER,
  ReportBankAccountFilter,
} from "@/src/features/reports/components/report-bank-account-filter";
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
import type { BankReport, ReportPeriodParams } from "@/src/features/reports/types/reports.types";
import { cn } from "@/src/lib/cn";
import { formatDateOnly, formatMoney } from "@/src/lib/format-display";
import { operationsApi } from "@/src/services/operations-api";
import { tableCenterCellClass, tableCenterColumnClass } from "@/src/components/ui/table";

const FOOTER_LABEL = "Total";

function useBankReportFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { periodParams, effectivePeriodParams } = useReportPeriodNavigation();

  const bankAccountId = searchParams.get("bankAccountId") ?? undefined;

  const updateSearchParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          next.set(key, value);
        } else {
          next.delete(key);
        }
      }
      router.replace(`?${next.toString()}`);
    },
    [router, searchParams],
  );

  const setPeriodParams = useCallback(
    (params: ReportPeriodParams) => {
      const next = new URLSearchParams(searchParams.toString());
      next.set("period", params.period ?? "this_month");
      if (params.period === "custom") {
        if (params.fromDate) next.set("fromDate", params.fromDate);
        else next.delete("fromDate");
        if (params.toDate) next.set("toDate", params.toDate);
        else next.delete("toDate");
      } else {
        next.delete("fromDate");
        next.delete("toDate");
      }
      router.replace(`?${next.toString()}`);
    },
    [router, searchParams],
  );

  const setBankAccountId = useCallback(
    (id: string | undefined) => {
      updateSearchParams({ bankAccountId: id });
    },
    [updateSearchParams],
  );

  const reportParams = useMemo(
    () => ({
      ...effectivePeriodParams,
      bankAccountId,
    }),
    [effectivePeriodParams, bankAccountId],
  );

  return {
    periodParams,
    setPeriodParams,
    bankAccountId,
    setBankAccountId,
    reportParams,
  };
}

function BankBalancesReportContent() {
  const { periodParams, setPeriodParams, bankAccountId, setBankAccountId, reportParams } =
    useBankReportFilters();
  const { data: report, loading } = useReportLoader<BankReport>(
    () => operationsApi.reports.banks({ ...reportParams, page: 1, limit: 50 }),
    [reportParams],
    "Failed to load bank balances report",
  );

  const netChange = Number(report?.summary.netChangeInPeriod ?? 0);
  const accounts = report?.accounts ?? [];
  const transactions = report?.transactions.items ?? [];
  const selectedBank = report?.banks.find((bank) => bank.id === report.selectedBankAccountId);
  const scopeHint = selectedBank ? selectedBank.label : "All banks";

  const accountTotals = useMemo(
    () => ({
      opening: sumDecimalStrings(accounts.map((a) => a.openingBalance)),
      periodStart: sumDecimalStrings(accounts.map((a) => a.balanceAtPeriodStart)),
      periodIn: sumDecimalStrings(accounts.map((a) => a.periodDeposits)),
      periodOut: sumDecimalStrings(accounts.map((a) => a.periodWithdrawals)),
      current: sumDecimalStrings(accounts.map((a) => a.currentBalance)),
    }),
    [accounts],
  );

  const transactionTotal = useMemo(
    () => sumDecimalStrings(transactions.map((row) => row.amount)),
    [transactions],
  );

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
      extraFilters={
        !report || report.banks.length > 1 ? (
          <ReportBankAccountFilter
            value={bankAccountId ?? ALL_BANKS_FILTER}
            onChange={setBankAccountId}
            banks={report?.banks ?? []}
            disabled={loading || !report}
          />
        ) : null
      }
      summary={
        report && !loading ? (
          <>
            <ReportSummaryStrip>
              <ReportSummaryCard
                label="Total current balance"
                value={formatMoney(report.summary.totalCurrentBalance)}
                hint={`Live · ${scopeHint}`}
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
              <strong>Current balance</strong> is live as of today
              {selectedBank ? (
                <>
                  {" "}
                  for <strong>{selectedBank.label}</strong>
                </>
              ) : (
                " across all bank accounts"
              )}
              . <strong>Period deposits and withdrawals</strong> cover only the selected date range.
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
            count={accounts.length}
            action={
              accounts.length > 0 ? (
                <ReportExportButton
                  fileName={buildReportExportFileName("banks", "accounts", report.period.label)}
                  sheetName="Accounts"
                  mode="loaded"
                  rows={accounts}
                  columns={[
                    { header: "Bank", getValue: (row) => row.bankName },
                    { header: "Account holder", getValue: (row) => row.accountHolderName },
                    { header: "Account #", getValue: (row) => row.accountNumber },
                    { header: "Status", getValue: (row) => (row.isActive ? "Active" : "Inactive") },
                    { header: "Opening", getValue: (row) => Number(row.openingBalance) },
                    { header: "At period start", getValue: (row) => Number(row.balanceAtPeriodStart) },
                    { header: "Period in", getValue: (row) => Number(row.periodDeposits) },
                    { header: "Period out", getValue: (row) => Number(row.periodWithdrawals) },
                    { header: "Current", getValue: (row) => Number(row.currentBalance) },
                  ]}
                  getFooterRow={() => [
                    "Total",
                    "",
                    "",
                    "",
                    Number(accountTotals.opening),
                    Number(accountTotals.periodStart),
                    Number(accountTotals.periodIn),
                    Number(accountTotals.periodOut),
                    Number(accountTotals.current),
                  ]}
                />
              ) : undefined
            }
          >
            {accounts.length > 0 ? (
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
                    {accounts.map((account) => (
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
                    <ReportTableMobileTotalCard
                      fields={[
                        { label: "Opening", value: formatMoney(accountTotals.opening) },
                        { label: "Period in", value: formatMoney(accountTotals.periodIn) },
                        { label: "Period out", value: formatMoney(accountTotals.periodOut) },
                        { label: "Current", value: formatMoney(accountTotals.current) },
                      ]}
                    />
                  </ListCardStack>
                }
                footer={
                  <ReportTableFooterRow
                    cells={[
                      "—",
                      "—",
                      formatMoney(accountTotals.opening),
                      formatMoney(accountTotals.periodStart),
                      formatMoney(accountTotals.periodIn),
                      formatMoney(accountTotals.periodOut),
                      formatMoney(accountTotals.current),
                    ]}
                  />
                }
              >
                {accounts.map((account) => (
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
            action={
              transactions.length > 0 ? (
                <ReportExportButton
                  fileName={buildReportExportFileName("banks", "transactions", report.period.label)}
                  sheetName="Transactions"
                  mode="fetchAll"
                  fetchAllPages={async (page, limit) => {
                    const data = await operationsApi.reports.banks({
                      ...reportParams,
                      page,
                      limit,
                    });
                    return {
                      items: data.transactions.items,
                      total: data.transactions.meta.total,
                    };
                  }}
                  columns={[
                    { header: "Date", getValue: (row) => formatDateOnly(row.transactionDate) },
                    {
                      header: "Bank account",
                      getValue: (row) => `${row.bankName} (${row.accountNumber})`,
                    },
                    { header: "Type", getValue: (row) => (row.type === "DEPOSIT" ? "Deposit" : "Withdrawal") },
                    { header: "Amount", getValue: (row) => Number(row.amount) },
                    { header: "Reference", getValue: (row) => row.referenceNumber?.trim() || "—" },
                    {
                      header: "Voucher",
                      getValue: (row) => row.proofAttachmentUrl ?? "—",
                    },
                    { header: "Recorded by", getValue: (row) => row.createdByName ?? "—" },
                  ]}
                  getFooterRow={(rows) => [
                    "Total",
                    "",
                    "",
                    Number(sumDecimalStrings(rows.map((row) => row.amount))),
                    "",
                    "",
                    "",
                  ]}
                />
              ) : undefined
            }
          >
            {transactions.length > 0 ? (
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
                    {transactions.map((row) => (
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
                    <ReportTableMobileTotalCard
                      label={FOOTER_LABEL}
                      fields={[{ label: "Amount", value: formatMoney(transactionTotal) }]}
                    />
                  </ListCardStack>
                }
                footer={
                  <ReportTableFooterRow
                    label={FOOTER_LABEL}
                    cells={["—", "—", formatMoney(transactionTotal), "—", "—", "—"]}
                  />
                }
              >
                {transactions.map((row) => (
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

"use client";

import Link from "next/link";
import { Card } from "@/src/components/ui/card";
import { EmptyState } from "@/src/components/ui/empty-state";
import { ReportExportButton } from "@/src/features/reports/components/report-export-button";
import {
  WaterfallRow,
  WaterfallSection,
} from "@/src/features/reports/components/report-waterfall-row";
import { buildReportExportFileName } from "@/src/features/reports/lib/build-report-export-file-name";
import {
  scrollToReportSection,
  type ProfitVsExpenseDetailSectionLinks,
} from "@/src/features/reports/lib/profit-vs-expense-sections";
import {
  reportHref,
  type ProfitVsExpenseBreakdown,
  type ReportPeriodParams,
} from "@/src/features/reports/types/reports.types";
import { formatMoney } from "@/src/lib/format-display";

function DrillDownLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="text-xs font-medium text-[var(--color-primary)] transition-colors hover:underline"
    >
      {label}
    </Link>
  );
}

function ScrollToSectionButton({ sectionId, label }: { sectionId: string; label: string }) {
  return (
    <button
      type="button"
      onClick={() => scrollToReportSection(sectionId)}
      className="text-xs font-medium text-[var(--color-primary)] transition-colors hover:underline"
      aria-label={label}
    >
      View
    </button>
  );
}

function isBreakdownEmpty(data: ProfitVsExpenseBreakdown): boolean {
  const values = [
    data.grossSalesBeforeDiscount,
    data.totalDiscountGiven,
    data.netRevenue,
    data.costOfGoodsSold,
    data.grossProfit,
    data.operatingExpenses,
    data.netProfit,
  ];
  return values.every((value) => Number(value) === 0);
}

function buildBreakdownExportRows(data: ProfitVsExpenseBreakdown) {
  return [
    { line: "Sales before discounts", amount: Number(data.grossSalesBeforeDiscount) },
    { line: "Discounts given", amount: Number(data.totalDiscountGiven) },
    { line: "Net revenue", amount: Number(data.netRevenue) },
    { line: "Cost of goods sold", amount: Number(data.costOfGoodsSold) },
    { line: "Gross profit", amount: Number(data.grossProfit) },
    { line: "Operating expenses", amount: Number(data.operatingExpenses) },
    { line: "Net profit", amount: Number(data.netProfit) },
  ];
}

export function ReportProfitExpenseWaterfall({
  data,
  periodParams,
  periodLabel,
  detailSectionLinks,
  showCard = true,
  showTitle = true,
}: {
  data: ProfitVsExpenseBreakdown;
  periodParams?: ReportPeriodParams;
  periodLabel?: string;
  detailSectionLinks?: ProfitVsExpenseDetailSectionLinks;
  showCard?: boolean;
  showTitle?: boolean;
}) {
  const discountNum = Number(data.totalDiscountGiven);
  const grossProfitNum = Number(data.grossProfit);
  const netProfitNum = Number(data.netProfit);
  const discountDisplay =
    discountNum > 0 ? `−${formatMoney(data.totalDiscountGiven)}` : formatMoney(data.totalDiscountGiven);

  if (isBreakdownEmpty(data)) {
    return (
      <EmptyState
        title="No profit or expense data in this period"
        description="Try widening the date range, or record sales and expenses."
      />
    );
  }

  const profitHref = periodParams ? reportHref("/reports/profit", periodParams) : "/reports/profit";
  const expensesHref = periodParams
    ? reportHref("/reports/expenses", periodParams)
    : "/reports/expenses";

  const revenueTitleAction = detailSectionLinks?.profitableItems ? (
    <ScrollToSectionButton
      sectionId={detailSectionLinks.profitableItems}
      label="View profitable items"
    />
  ) : periodParams ? (
    <DrillDownLink href={profitHref} label="View" />
  ) : null;

  const discountLabelAction = detailSectionLinks?.discountTransactions ? (
    <ScrollToSectionButton
      sectionId={detailSectionLinks.discountTransactions}
      label="View discount transactions"
    />
  ) : null;

  const operatingTitleAction = detailSectionLinks?.expenseCategories ? (
    <ScrollToSectionButton
      sectionId={detailSectionLinks.expenseCategories}
      label="View expense categories"
    />
  ) : periodParams ? (
    <DrillDownLink href={expensesHref} label="View" />
  ) : null;

  const exportRows = buildBreakdownExportRows(data);

  const breakdown = (
    <div className="space-y-5" role="list" aria-label="Profit vs expense breakdown">
      <WaterfallSection id="pve-revenue" title="Revenue" titleAction={revenueTitleAction}>
        <WaterfallRow
          label="Sales before discounts"
          value={formatMoney(data.grossSalesBeforeDiscount)}
        />
        <WaterfallRow
          label="Discounts given"
          value={discountDisplay}
          tone="warning"
          dividerAfter
          labelAction={discountLabelAction}
        />
        <WaterfallRow label="Net revenue" value={formatMoney(data.netRevenue)} emphasized />
      </WaterfallSection>

      <WaterfallSection
        id="pve-cogs"
        title="Cost of sales"
        helperText="Sum of quantity sold × menu item cost for all items in this period."
      >
        <WaterfallRow
          label="Cost of goods sold"
          value={`−${formatMoney(data.costOfGoodsSold)}`}
          tone="warning"
          dividerAfter
        />
        <WaterfallRow
          label="Gross profit"
          value={formatMoney(data.grossProfit)}
          tone={grossProfitNum >= 0 ? "positive" : "negative"}
          emphasized
        />
      </WaterfallSection>

      <WaterfallSection
        id="pve-operating"
        title="Operating costs"
        helperText="Sum of all expense entries recorded in this period."
        titleAction={operatingTitleAction}
      >
        <WaterfallRow
          label="Operating expenses"
          value={`−${formatMoney(data.operatingExpenses)}`}
          tone="warning"
          dividerAfter
        />
        <WaterfallRow
          label="Net profit"
          value={formatMoney(data.netProfit)}
          tone={netProfitNum >= 0 ? "positive" : "negative"}
          emphasized
        />
      </WaterfallSection>

      <p className="text-xs text-muted">
        Net profit = revenue − COGS − operating expenses
      </p>
    </div>
  );

  const header =
    showTitle ? (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-subtle">
          Profit vs expense
        </p>
        {periodLabel ? (
          <ReportExportButton
            fileName={buildReportExportFileName("profit-vs-expense", "breakdown", periodLabel)}
            sheetName="Profit vs expense"
            mode="loaded"
            rows={exportRows}
            columns={[
              { header: "Line", getValue: (row) => row.line },
              { header: "Amount", getValue: (row) => row.amount },
            ]}
            getFooterRow={() => []}
          />
        ) : null}
      </div>
    ) : null;

  if (!showCard) {
    return (
      <div className="space-y-3">
        {header}
        {breakdown}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {header}
      <Card density="compact" className="space-y-0">
        {breakdown}
      </Card>
    </div>
  );
}

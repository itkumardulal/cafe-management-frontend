"use client";

import { useMemo } from "react";
import { ListCard, ListCardStack } from "@/src/components/shared/list-card";
import { Card } from "@/src/components/ui/card";
import {
  ResponsiveTable,
  tableCenterCellClass,
  tableCenterColumnClass,
} from "@/src/components/ui/table";
import { ReportExportButton } from "@/src/features/reports/components/report-export-button";
import { buildReportExportFileName } from "@/src/features/reports/lib/build-report-export-file-name";
import {
  averageDecimalStrings,
  sumDecimalStrings,
  sumField,
  sumQuantityFromField,
} from "@/src/features/reports/lib/report-table-totals";
import { cn } from "@/src/lib/cn";
import { formatMoney } from "@/src/lib/format-display";
import { roundMoneyStr } from "@/src/lib/money-input";
import type { ProfitReport } from "@/src/features/reports/types/reports.types";

type ProfitItem = ProfitReport["topProfitableItems"][number];

const FOOTER_LABEL = "Total";

function ReportProfitBillSummary({
  profitBeforeDiscount,
  totalDiscountGiven,
  grossProfit,
  className,
}: {
  profitBeforeDiscount: string;
  totalDiscountGiven: string;
  grossProfit: string;
  className?: string;
}) {
  const discountNum = Number(totalDiscountGiven);
  const grossProfitNum = Number(grossProfit);

  return (
    <div className={cn("w-full max-w-sm", className)}>
      <dl className="space-y-1.5 text-sm">
        <div className="flex justify-between gap-4 text-muted">
          <dt>Profit before discount</dt>
          <dd className="font-mono tabular-nums">{formatMoney(profitBeforeDiscount)}</dd>
        </div>
        <div className="flex justify-between gap-4 text-muted">
          <dt>Discount amount</dt>
          <dd className="font-mono tabular-nums text-amber-700 dark:text-amber-400">
            {discountNum > 0 ? `−${formatMoney(totalDiscountGiven)}` : formatMoney(totalDiscountGiven)}
          </dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-[var(--color-border)] pt-2 font-semibold text-foreground">
          <dt>Total profit</dt>
          <dd
            className={cn(
              "font-mono text-base tabular-nums",
              grossProfitNum >= 0
                ? "text-emerald-700 dark:text-emerald-400"
                : "text-red-700 dark:text-red-400",
            )}
          >
            {formatMoney(grossProfit)}
          </dd>
        </div>
      </dl>
    </div>
  );
}

export function ReportProfitItemsTable({
  items,
  totalDiscountGiven,
  grossProfit,
  periodLabel,
  exportSlug = "profit",
}: {
  items: ProfitItem[];
  totalDiscountGiven: string;
  grossProfit: string;
  periodLabel?: string;
  exportSlug?: string;
}) {
  const totals = useMemo(
    () => ({
      quantitySold: sumQuantityFromField(items, "quantitySold"),
      revenue: sumField(items, "revenue"),
      cost: sumField(items, "cost"),
      profit: sumField(items, "profit"),
    }),
    [items],
  );

  const averageMargin = averageDecimalStrings(items.map((item) => item.marginPercent));
  const profitBeforeDiscount = roundMoneyStr(Number(grossProfit) + Number(totalDiscountGiven));

  const exportExtraRows = [
    { label: "Profit before discount", value: Number(profitBeforeDiscount) },
    { label: "Discount amount", value: Number(totalDiscountGiven) },
    { label: "Total profit", value: Number(grossProfit) },
  ];

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <ReportExportButton
          fileName={buildReportExportFileName(exportSlug, "top-items", periodLabel)}
          sheetName="Profit items"
          mode="loaded"
          rows={items}
          columns={[
            { header: "Menu item", getValue: (row) => row.name },
            { header: "Qty", getValue: (row) => Number(row.quantitySold) },
            { header: "Revenue", getValue: (row) => Number(row.revenue) },
            { header: "Cost", getValue: (row) => Number(row.cost) },
            { header: "Profit", getValue: (row) => Number(row.profit) },
            { header: "Item margin %", getValue: (row) => Number(row.marginPercent) },
          ]}
          getFooterRow={() => [
            FOOTER_LABEL,
            totals.quantitySold,
            Number(totals.revenue),
            Number(totals.cost),
            Number(totals.profit),
            Number(averageMargin),
          ]}
          extraRows={exportExtraRows}
        />
      </div>

      <div className="space-y-0">
        <ListCardStack className="md:hidden">
          {items.map((item) => (
            <ListCard
              key={item.menuItemId}
              title={item.name}
              fields={[
                { label: "Qty", value: item.quantitySold },
                { label: "Revenue", value: formatMoney(item.revenue) },
                { label: "Cost", value: formatMoney(item.cost) },
                { label: "Profit", value: formatMoney(item.profit) },
                { label: "Item margin", value: `${item.marginPercent}%` },
              ]}
            />
          ))}
          <ListCard
            title={FOOTER_LABEL}
            className="border-[var(--color-border)] bg-[var(--color-surface-muted)]"
            fields={[
              { label: "Qty", value: String(totals.quantitySold) },
              { label: "Revenue", value: formatMoney(totals.revenue) },
              { label: "Cost", value: formatMoney(totals.cost) },
              { label: "Profit", value: formatMoney(totals.profit) },
              { label: "Avg. item margin", value: `${averageMargin}%` },
            ]}
          />
          <Card density="compact" className="p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-subtle">
              Period profit summary
            </p>
            <ReportProfitBillSummary
              profitBeforeDiscount={profitBeforeDiscount}
              totalDiscountGiven={totalDiscountGiven}
              grossProfit={grossProfit}
            />
          </Card>
        </ListCardStack>

        <Card density="comfortable" className="hidden overflow-hidden p-0 md:block">
          <ResponsiveTable
            variant="embedded"
            horizontalScroll={false}
            headers={[
              "Menu item",
              { label: "Qty", thClassName: tableCenterColumnClass },
              { label: "Revenue", thClassName: tableCenterColumnClass },
              { label: "Cost", thClassName: tableCenterColumnClass },
              { label: "Profit", thClassName: tableCenterColumnClass },
              { label: "Item margin", thClassName: tableCenterColumnClass },
            ]}
          >
            {items.map((item) => (
              <tr key={item.menuItemId}>
                <td className="font-medium">{item.name}</td>
                <td className={tableCenterCellClass}>{item.quantitySold}</td>
                <td className={cn(tableCenterCellClass, "font-mono tabular-nums")}>
                  {formatMoney(item.revenue)}
                </td>
                <td className={cn(tableCenterCellClass, "font-mono tabular-nums")}>
                  {formatMoney(item.cost)}
                </td>
                <td
                  className={cn(
                    tableCenterCellClass,
                    "font-mono tabular-nums text-emerald-700 dark:text-emerald-400",
                  )}
                >
                  {formatMoney(item.profit)}
                </td>
                <td className={cn(tableCenterCellClass, "tabular-nums")}>{item.marginPercent}%</td>
              </tr>
            ))}
            <tr className="border-t-2 border-[var(--color-border)] bg-[var(--color-surface-muted)] font-semibold">
              <td>{FOOTER_LABEL}</td>
              <td className={tableCenterCellClass}>{totals.quantitySold}</td>
              <td className={cn(tableCenterCellClass, "font-mono tabular-nums")}>
                {formatMoney(totals.revenue)}
              </td>
              <td className={cn(tableCenterCellClass, "font-mono tabular-nums")}>
                {formatMoney(totals.cost)}
              </td>
              <td
                className={cn(
                  tableCenterCellClass,
                  "font-mono tabular-nums text-emerald-700 dark:text-emerald-400",
                )}
              >
                {formatMoney(totals.profit)}
              </td>
              <td className={cn(tableCenterCellClass, "tabular-nums")} title="Average of item margins in this table">
                {averageMargin}%
              </td>
            </tr>
          </ResponsiveTable>

          <div className="flex justify-end border-t border-[var(--color-border)] bg-[var(--color-surface-muted)]/50 px-4 py-4">
            <ReportProfitBillSummary
              profitBeforeDiscount={profitBeforeDiscount}
              totalDiscountGiven={totalDiscountGiven}
              grossProfit={grossProfit}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}

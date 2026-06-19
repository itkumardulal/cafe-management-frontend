"use client";

import { useMemo } from "react";
import { Badge } from "@/src/components/ui/badge";
import { ListCard, ListCardStack } from "@/src/components/shared/list-card";
import { ReportDataTable } from "@/src/features/reports/components/report-data-table";
import { ReportExportButton } from "@/src/features/reports/components/report-export-button";
import { ReportSection } from "@/src/features/reports/components/report-detail-shell";
import { ReportTableFooterRow } from "@/src/features/reports/components/report-table-footer-row";
import { ReportTableMobileTotalCard } from "@/src/features/reports/components/report-table-mobile-total-card";
import { buildReportExportFileName } from "@/src/features/reports/lib/build-report-export-file-name";
import { sumDecimalStrings } from "@/src/features/reports/lib/report-table-totals";
import type {
  DiscountReport,
  ReportPeriodParams,
} from "@/src/features/reports/types/reports.types";
import { cn } from "@/src/lib/cn";
import { formatDateOnly, formatMoney } from "@/src/lib/format-display";
import { operationsApi } from "@/src/services/operations-api";
import { tableCenterCellClass, tableCenterColumnClass } from "@/src/components/ui/table";

type DiscountTransactionRow = DiscountReport["items"][number];

const FOOTER_LABEL = "Total";

export function ReportDiscountTransactionsTable({
  items,
  totalCount,
  periodLabel,
  periodParams,
  exportSlug = "discounts",
  sectionId,
}: {
  items: DiscountTransactionRow[];
  totalCount: number;
  periodLabel: string;
  periodParams?: ReportPeriodParams;
  exportSlug?: string;
  sectionId?: string;
}) {
  const totals = useMemo(
    () => ({
      discount: sumDecimalStrings(items.map((item) => item.discountAmount)),
      billTotal: sumDecimalStrings(items.map((item) => item.grandTotal)),
    }),
    [items],
  );

  return (
    <ReportSection
      id={sectionId}
      title="Discount transactions"
      description="Every bill with a discount applied."
      count={totalCount}
      action={
        <ReportExportButton
          fileName={buildReportExportFileName(exportSlug, "transactions", periodLabel)}
          sheetName="Discounts"
          mode="fetchAll"
          fetchAllPages={
            periodParams
              ? async (page, limit) => {
                  const data = await operationsApi.reports.discounts({
                    ...periodParams,
                    page,
                    limit,
                  });
                  return { items: data.items, total: data.meta.total };
                }
              : undefined
          }
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
            cells={["—", "—", formatMoney(totals.discount), formatMoney(totals.billTotal)]}
          />
        }
      >
        {items.map((item) => (
          <tr key={item.id}>
            <td className="font-mono text-sm">{item.receiptNo}</td>
            <td className={tableCenterCellClass}>{formatDateOnly(item.saleAt)}</td>
            <td>{item.staff?.fullName ?? "Unknown"}</td>
            <td
              className={cn(
                tableCenterCellClass,
                "font-mono tabular-nums text-[var(--color-nav-active-text)]",
              )}
            >
              {formatMoney(item.discountAmount)}
            </td>
            <td className={cn(tableCenterCellClass, "font-mono tabular-nums")}>
              {formatMoney(item.grandTotal)}
            </td>
          </tr>
        ))}
      </ReportDataTable>
    </ReportSection>
  );
}

"use client";

import { useMemo } from "react";
import { ListCard, ListCardStack } from "@/src/components/shared/list-card";
import { ReportDataTable } from "@/src/features/reports/components/report-data-table";
import { ReportExportButton } from "@/src/features/reports/components/report-export-button";
import { ReportSection } from "@/src/features/reports/components/report-detail-shell";
import { ReportTableFooterRow } from "@/src/features/reports/components/report-table-footer-row";
import { ReportTableMobileTotalCard } from "@/src/features/reports/components/report-table-mobile-total-card";
import { buildReportExportFileName } from "@/src/features/reports/lib/build-report-export-file-name";
import { sumDecimalStrings } from "@/src/features/reports/lib/report-table-totals";
import type { ExpenseReport } from "@/src/features/reports/types/reports.types";
import { cn } from "@/src/lib/cn";
import { formatMoney } from "@/src/lib/format-display";
import { tableCenterCellClass, tableCenterColumnClass } from "@/src/components/ui/table";

type ExpenseCategoryRow = ExpenseReport["byCategory"][number];

export function ReportExpenseCategoryTable({
  rows,
  periodLabel,
  exportSlug = "expenses",
  sectionId,
}: {
  rows: ExpenseCategoryRow[];
  periodLabel: string;
  exportSlug?: string;
  sectionId?: string;
}) {
  const totalAmount = useMemo(
    () => sumDecimalStrings(rows.map((row) => row.amount)),
    [rows],
  );

  const getFooterRow = () => ["Total", Number(totalAmount), 100];

  return (
    <ReportSection
      id={sectionId}
      title="Expenses by category"
      description="Share of total spend per category."
      count={rows.length}
      action={
        <ReportExportButton
          fileName={buildReportExportFileName(exportSlug, "by-category", periodLabel)}
          sheetName="By category"
          mode="loaded"
          rows={rows}
          columns={[
            { header: "Category", getValue: (row) => row.label },
            { header: "Amount", getValue: (row) => Number(row.amount) },
            { header: "% of total", getValue: (row) => Number(row.percentOfTotal) },
          ]}
          getFooterRow={getFooterRow}
        />
      }
    >
      <ReportDataTable
        headers={[
          "Category",
          { label: "Amount", thClassName: tableCenterColumnClass },
          { label: "% of total", thClassName: tableCenterColumnClass },
        ]}
        mobileCards={
          <ListCardStack>
            {rows.map((row) => (
              <ListCard
                key={row.category}
                title={row.label}
                fields={[
                  { label: "Amount", value: formatMoney(row.amount) },
                  { label: "% of total", value: `${row.percentOfTotal}%` },
                ]}
              />
            ))}
            <ReportTableMobileTotalCard
              fields={[
                { label: "Amount", value: formatMoney(totalAmount) },
                { label: "% of total", value: "100%" },
              ]}
            />
          </ListCardStack>
        }
        footer={<ReportTableFooterRow cells={[formatMoney(totalAmount), "100%"]} />}
      >
        {rows.map((row) => (
          <tr key={row.category}>
            <td className="font-medium">{row.label}</td>
            <td className={cn(tableCenterCellClass, "font-mono tabular-nums")}>
              {formatMoney(row.amount)}
            </td>
            <td className={tableCenterCellClass}>{row.percentOfTotal}%</td>
          </tr>
        ))}
      </ReportDataTable>
    </ReportSection>
  );
}

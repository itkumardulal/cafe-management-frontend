"use client";

import { Suspense, useMemo, useState } from "react";
import { Badge } from "@/src/components/ui/badge";
import { EmptyState } from "@/src/components/ui/empty-state";
import { ListCard, ListCardStack } from "@/src/components/shared/list-card";
import { ReportDataTable } from "@/src/features/reports/components/report-data-table";
import { ReportExportButton } from "@/src/features/reports/components/report-export-button";
import {
  ReportSection,
  ReportSummaryCard,
  ReportSummaryStrip,
  ReportTabs,
} from "@/src/features/reports/components/report-detail-shell";
import { ReportTableFooterRow } from "@/src/features/reports/components/report-table-footer-row";
import { ReportTableMobileTotalCard } from "@/src/features/reports/components/report-table-mobile-total-card";
import { ReportPageLayout } from "@/src/features/reports/components/report-page-layout";
import { ReportDetailSkeleton } from "@/src/features/reports/components/reports-skeleton";
import { useReportPeriodNavigation } from "@/src/features/reports/components/reports-hub-content";
import { useReportLoader } from "@/src/features/reports/hooks/use-report-loader";
import { buildReportExportFileName } from "@/src/features/reports/lib/build-report-export-file-name";
import {
  parseNumericString,
  sumDecimalStrings,
} from "@/src/features/reports/lib/report-table-totals";
import type { InventoryReport } from "@/src/features/reports/types/reports.types";
import { cn } from "@/src/lib/cn";
import { formatMoney } from "@/src/lib/format-display";
import { operationsApi } from "@/src/services/operations-api";
import { tableCenterCellClass, tableCenterColumnClass } from "@/src/components/ui/table";

function formatDirectPurchaseUnit(item: {
  unitType?: string | null;
  unitQuantity?: string | null;
}) {
  return [item.unitQuantity?.trim(), item.unitType?.trim()].filter(Boolean).join(" ");
}

function InventoryReportContent() {
  const { periodParams, effectivePeriodParams, setPeriodParams } = useReportPeriodNavigation();
  const [tab, setTab] = useState<"stock" | "alerts" | "activity" | "purchases">("stock");
  const { data: report, loading } = useReportLoader<InventoryReport>(
    () => operationsApi.reports.inventory({ ...effectivePeriodParams, page: 1, limit: 100 }),
    [effectivePeriodParams],
    "Failed to load inventory report",
  );

  const stockItems = report?.snapshot.currentStock ?? [];
  const alertItems = report
    ? [...report.snapshot.alerts.out, ...report.snapshot.alerts.low]
    : [];
  const activityItems = report?.periodActivity.items ?? [];
  const rawPurchases = report?.periodActivity.rawMaterialPurchases ?? [];
  const directPurchases = report?.periodActivity.directPurchases ?? [];

  const tabs = useMemo(
    () =>
      report
        ? [
            { id: "stock" as const, label: "Current stock", count: stockItems.length },
            {
              id: "alerts" as const,
              label: "Alerts",
              count: report.snapshot.alerts.counts.low + report.snapshot.alerts.counts.out,
            },
            {
              id: "activity" as const,
              label: "Period activity",
              count: activityItems.length,
            },
            {
              id: "purchases" as const,
              label: "Purchases",
              count: rawPurchases.length + directPurchases.length,
            },
          ]
        : [],
    [report, stockItems.length, activityItems.length, rawPurchases.length, directPurchases.length],
  );

  const alertCount = report
    ? report.snapshot.alerts.counts.low + report.snapshot.alerts.counts.out
    : 0;

  const activityTotals = useMemo(
    () => ({
      added: activityItems.reduce((acc, item) => acc + parseNumericString(item.purchasedOrAdded), 0),
      consumed: activityItems.reduce((acc, item) => acc + parseNumericString(item.consumed), 0),
      remaining: activityItems.reduce((acc, item) => acc + parseNumericString(item.remaining), 0),
    }),
    [activityItems],
  );

  const rawPurchaseTotal = useMemo(
    () => sumDecimalStrings(rawPurchases.map((item) => item.totalPurchaseValue)),
    [rawPurchases],
  );

  const directPurchaseTotal = useMemo(
    () => sumDecimalStrings(directPurchases.map((item) => item.totalPurchaseValue)),
    [directPurchases],
  );

  return (
    <ReportPageLayout
      slug="inventory"
      periodParams={periodParams}
      onPeriodChange={setPeriodParams}
      periodLabel={report?.period.label}
      loading={loading}
      summary={
        report && !loading ? (
          <ReportSummaryStrip>
            <ReportSummaryCard label="Items tracked" value={String(report.snapshot.itemsTracked)} tone="info" />
            <ReportSummaryCard
              label="Low stock"
              value={String(report.snapshot.alerts.counts.low)}
              tone={report.snapshot.alerts.counts.low > 0 ? "warning" : "neutral"}
            />
            <ReportSummaryCard
              label="Out of stock"
              value={String(report.snapshot.alerts.counts.out)}
              tone={report.snapshot.alerts.counts.out > 0 ? "negative" : "neutral"}
            />
          </ReportSummaryStrip>
        ) : null
      }
    >
      {loading ? (
        <ReportDetailSkeleton columns={4} />
      ) : report ? (
        <div className="space-y-4">
          <ReportTabs tabs={tabs} active={tab} onChange={setTab} />

          {tab === "stock" ? (
            stockItems.length > 0 ? (
              <ReportSection
                title="Current stock levels"
                description="Live quantities for tracked items."
                count={stockItems.length}
                action={
                  <ReportExportButton
                    fileName={buildReportExportFileName("inventory", "current-stock", report.period.label)}
                    sheetName="Stock"
                    mode="loaded"
                    rows={stockItems}
                    columns={[
                      { header: "Item", getValue: (row) => row.name },
                      { header: "Type", getValue: (row) => row.kind },
                      {
                        header: "On hand",
                        getValue: (row) => row.quantityOnHand,
                      },
                      { header: "Reorder", getValue: (row) => row.reorderLevel ?? "—" },
                    ]}
                    getFooterRow={() => [`${stockItems.length} items`, "", "", ""]}
                  />
                }
              >
                <ReportDataTable
                  headers={[
                    "Item",
                    { label: "Type", thClassName: tableCenterColumnClass },
                    { label: "On hand", thClassName: tableCenterColumnClass },
                    { label: "Reorder", thClassName: tableCenterColumnClass },
                  ]}
                  mobileCards={
                    <ListCardStack>
                      {stockItems.map((item) => (
                        <ListCard
                          key={item.id}
                          title={item.name}
                          badge={<Badge size="sm">{item.kind}</Badge>}
                          fields={[
                            {
                              label: "On hand",
                              value: item.quantityOnHand,
                            },
                            { label: "Reorder", value: item.reorderLevel ?? "—" },
                          ]}
                        />
                      ))}
                      <ReportTableMobileTotalCard
                        label={`${stockItems.length} items`}
                        fields={[]}
                      />
                    </ListCardStack>
                  }
                  footer={
                    <ReportTableFooterRow
                      label={`${stockItems.length} items`}
                      cells={["—", "—", "—"]}
                    />
                  }
                >
                  {stockItems.map((item) => (
                    <tr key={item.id}>
                      <td className="font-medium">{item.name}</td>
                      <td className={tableCenterCellClass}>
                        <Badge size="sm">{item.kind}</Badge>
                      </td>
                      <td className={tableCenterCellClass}>{item.quantityOnHand}</td>
                      <td className={tableCenterCellClass}>{item.reorderLevel ?? "—"}</td>
                    </tr>
                  ))}
                </ReportDataTable>
              </ReportSection>
            ) : (
              <EmptyState
                title="No tracked stock"
                description="Enable stock tracking on menu or inventory items."
              />
            )
          ) : null}

          {tab === "alerts" ? (
            alertItems.length > 0 ? (
              <ReportSection
                title="Stock alerts"
                description="Items at or below reorder levels."
                count={alertCount}
                action={
                  <ReportExportButton
                    fileName={buildReportExportFileName("inventory", "alerts", report.period.label)}
                    sheetName="Alerts"
                    mode="loaded"
                    rows={alertItems}
                    columns={[
                      { header: "Item", getValue: (row) => row.name },
                      {
                        header: "Status",
                        getValue: (row) =>
                          report.snapshot.alerts.out.some((o) => o.id === row.id) ? "Out" : "Low",
                      },
                      { header: "On hand", getValue: (row) => row.quantityOnHand },
                    ]}
                    getFooterRow={() => [`${alertItems.length} items`, "", ""]}
                  />
                }
              >
                <ReportDataTable
                  headers={[
                    "Item",
                    { label: "Status", thClassName: tableCenterColumnClass },
                    { label: "On hand", thClassName: tableCenterColumnClass },
                  ]}
                  mobileCards={
                    <ListCardStack>
                      {alertItems.map((item) => {
                        const isOut = report.snapshot.alerts.out.some((o) => o.id === item.id);
                        return (
                          <ListCard
                            key={item.id}
                            title={item.name}
                            badge={
                              <Badge variant={isOut ? "danger" : "warning"} size="sm">
                                {isOut ? "Out" : "Low"}
                              </Badge>
                            }
                            fields={[{ label: "On hand", value: item.quantityOnHand }]}
                          />
                        );
                      })}
                      <ReportTableMobileTotalCard label={`${alertItems.length} items`} fields={[]} />
                    </ListCardStack>
                  }
                  footer={
                    <ReportTableFooterRow
                      label={`${alertItems.length} items`}
                      cells={["—", "—"]}
                    />
                  }
                >
                  {alertItems.map((item) => {
                    const isOut = report.snapshot.alerts.out.some((o) => o.id === item.id);
                    return (
                      <tr key={item.id}>
                        <td className="font-medium">{item.name}</td>
                        <td className={tableCenterCellClass}>
                          <Badge variant={isOut ? "danger" : "warning"} size="sm">
                            {isOut ? "Out" : "Low"}
                          </Badge>
                        </td>
                        <td className={tableCenterCellClass}>{item.quantityOnHand}</td>
                      </tr>
                    );
                  })}
                </ReportDataTable>
              </ReportSection>
            ) : (
              <EmptyState title="No stock alerts" description="All tracked items are above reorder levels." />
            )
          ) : null}

          {tab === "activity" ? (
            activityItems.length > 0 ? (
              <ReportSection
                title="Period movement"
                description="Added vs consumed during the selected reporting period."
                count={activityItems.length}
                action={
                  <ReportExportButton
                    fileName={buildReportExportFileName("inventory", "period-activity", report.period.label)}
                    sheetName="Activity"
                    mode="fetchAll"
                    fetchAllPages={async (page, limit) => {
                      const data = await operationsApi.reports.inventory({
                        ...effectivePeriodParams,
                        page,
                        limit,
                      });
                      return {
                        items: data.periodActivity.items,
                        total: data.periodActivity.meta.total,
                      };
                    }}
                    columns={[
                      { header: "Item", getValue: (row) => row.itemName },
                      { header: "Added", getValue: (row) => parseNumericString(row.purchasedOrAdded) },
                      { header: "Consumed", getValue: (row) => parseNumericString(row.consumed) },
                      { header: "Remaining", getValue: (row) => parseNumericString(row.remaining) },
                    ]}
                    getFooterRow={(rows) => [
                      "Total",
                      rows.reduce((acc, row) => acc + parseNumericString(row.purchasedOrAdded), 0),
                      rows.reduce((acc, row) => acc + parseNumericString(row.consumed), 0),
                      rows.reduce((acc, row) => acc + parseNumericString(row.remaining), 0),
                    ]}
                  />
                }
              >
                <ReportDataTable
                  headers={[
                    "Item",
                    { label: "Added", thClassName: tableCenterColumnClass },
                    { label: "Consumed", thClassName: tableCenterColumnClass },
                    { label: "Remaining", thClassName: tableCenterColumnClass },
                  ]}
                  mobileCards={
                    <ListCardStack>
                      {activityItems.map((item) => (
                        <ListCard
                          key={`${item.itemKind}-${item.itemId}`}
                          title={item.itemName}
                          fields={[
                            { label: "Added", value: item.purchasedOrAdded },
                            { label: "Consumed", value: item.consumed },
                            { label: "Remaining", value: item.remaining },
                          ]}
                        />
                      ))}
                      <ReportTableMobileTotalCard
                        label="Total"
                        fields={[
                          { label: "Added", value: String(activityTotals.added) },
                          { label: "Consumed", value: String(activityTotals.consumed) },
                          { label: "Remaining", value: String(activityTotals.remaining) },
                        ]}
                      />
                    </ListCardStack>
                  }
                  footer={
                    <ReportTableFooterRow
                      label="Total"
                      cells={[activityTotals.added, activityTotals.consumed, activityTotals.remaining]}
                    />
                  }
                >
                  {activityItems.map((item) => (
                    <tr key={`${item.itemKind}-${item.itemId}`}>
                      <td className="font-medium">{item.itemName}</td>
                      <td className={tableCenterCellClass}>{item.purchasedOrAdded}</td>
                      <td className={tableCenterCellClass}>{item.consumed}</td>
                      <td className={tableCenterCellClass}>{item.remaining}</td>
                    </tr>
                  ))}
                </ReportDataTable>
              </ReportSection>
            ) : (
              <EmptyState title="No movement in period" description="No stock changes recorded." />
            )
          ) : null}

          {tab === "purchases" ? (
            <>
              {rawPurchases.length > 0 ? (
                <ReportSection
                  title="Raw material purchases"
                  description="Purchase totals only — on-hand ingredient tracking is not enabled."
                  count={rawPurchases.length}
                  action={
                    <ReportExportButton
                      fileName={buildReportExportFileName(
                        "inventory",
                        "raw-purchases",
                        report.period.label,
                      )}
                      sheetName="Raw purchases"
                      mode="loaded"
                      rows={rawPurchases}
                      columns={[
                        { header: "Raw material", getValue: (row) => row.name },
                        {
                          header: "Qty purchased",
                          getValue: (row) => `${row.totalPurchasedQty} ${row.unit ?? ""}`.trim(),
                        },
                        { header: "Value", getValue: (row) => Number(row.totalPurchaseValue) },
                      ]}
                      getFooterRow={() => ["Total", "", Number(rawPurchaseTotal)]}
                    />
                  }
                >
                  <ReportDataTable
                    headers={[
                      "Raw material",
                      { label: "Qty purchased", thClassName: tableCenterColumnClass },
                      { label: "Value", thClassName: tableCenterColumnClass },
                    ]}
                    mobileCards={
                      <ListCardStack>
                        {rawPurchases.map((item) => (
                          <ListCard
                            key={item.rawMaterialItemId}
                            title={item.name}
                            fields={[
                              {
                                label: "Qty purchased",
                                value: `${item.totalPurchasedQty} ${item.unit ?? ""}`.trim(),
                              },
                              { label: "Value", value: formatMoney(item.totalPurchaseValue) },
                            ]}
                          />
                        ))}
                        <ReportTableMobileTotalCard
                          fields={[{ label: "Value", value: formatMoney(rawPurchaseTotal) }]}
                        />
                      </ListCardStack>
                    }
                    footer={
                      <ReportTableFooterRow cells={["—", formatMoney(rawPurchaseTotal)]} />
                    }
                  >
                    {rawPurchases.map((item) => (
                      <tr key={item.rawMaterialItemId}>
                        <td className="font-medium">{item.name}</td>
                        <td className={tableCenterCellClass}>
                          {item.totalPurchasedQty} {item.unit ?? ""}
                        </td>
                        <td className={cn(tableCenterCellClass, "font-mono tabular-nums")}>
                          {formatMoney(item.totalPurchaseValue)}
                        </td>
                      </tr>
                    ))}
                  </ReportDataTable>
                </ReportSection>
              ) : null}
              {directPurchases.length > 0 ? (
                <ReportSection
                  title="Direct purchases"
                  description="Stockable menu items purchased for resale — increases on-hand stock."
                  count={directPurchases.length}
                  action={
                    <ReportExportButton
                      fileName={buildReportExportFileName(
                        "inventory",
                        "direct-purchases",
                        report.period.label,
                      )}
                      sheetName="Direct purchases"
                      mode="loaded"
                      rows={directPurchases}
                      columns={[
                        { header: "Menu item", getValue: (row) => row.name },
                        {
                          header: "Qty purchased",
                          getValue: (row) =>
                            `${row.totalPurchasedQty} ${formatDirectPurchaseUnit(row)}`.trim(),
                        },
                        { header: "Value", getValue: (row) => Number(row.totalPurchaseValue) },
                      ]}
                      getFooterRow={() => ["Total", "", Number(directPurchaseTotal)]}
                    />
                  }
                >
                  <ReportDataTable
                    headers={[
                      "Menu item",
                      { label: "Qty purchased", thClassName: tableCenterColumnClass },
                      { label: "Value", thClassName: tableCenterColumnClass },
                    ]}
                    mobileCards={
                      <ListCardStack>
                        {directPurchases.map((item) => (
                          <ListCard
                            key={item.directPurchaseItemId}
                            title={item.name}
                            fields={[
                              {
                                label: "Qty purchased",
                                value: `${item.totalPurchasedQty} ${formatDirectPurchaseUnit(item)}`.trim(),
                              },
                              { label: "Value", value: formatMoney(item.totalPurchaseValue) },
                            ]}
                          />
                        ))}
                        <ReportTableMobileTotalCard
                          fields={[{ label: "Value", value: formatMoney(directPurchaseTotal) }]}
                        />
                      </ListCardStack>
                    }
                    footer={
                      <ReportTableFooterRow cells={["—", formatMoney(directPurchaseTotal)]} />
                    }
                  >
                    {directPurchases.map((item) => (
                      <tr key={item.directPurchaseItemId}>
                        <td className="font-medium">{item.name}</td>
                        <td className={tableCenterCellClass}>
                          {item.totalPurchasedQty} {formatDirectPurchaseUnit(item)}
                        </td>
                        <td className={cn(tableCenterCellClass, "font-mono tabular-nums")}>
                          {formatMoney(item.totalPurchaseValue)}
                        </td>
                      </tr>
                    ))}
                  </ReportDataTable>
                </ReportSection>
              ) : null}
              {rawPurchases.length === 0 && directPurchases.length === 0 ? (
                <EmptyState title="No purchases" description="No raw material or direct purchases in this period." />
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}
    </ReportPageLayout>
  );
}

export default function InventoryReportPage() {
  return (
    <Suspense fallback={<ReportDetailSkeleton columns={4} />}>
      <InventoryReportContent />
    </Suspense>
  );
}

"use client";

import { Suspense, useMemo, useState } from "react";
import { Badge } from "@/src/components/ui/badge";
import { EmptyState } from "@/src/components/ui/empty-state";
import { ListCard, ListCardStack } from "@/src/components/shared/list-card";
import { ReportDataTable } from "@/src/features/reports/components/report-data-table";
import {
  ReportSection,
  ReportSummaryCard,
  ReportSummaryStrip,
  ReportTabs,
} from "@/src/features/reports/components/report-detail-shell";
import { ReportPageLayout } from "@/src/features/reports/components/report-page-layout";
import { ReportDetailSkeleton } from "@/src/features/reports/components/reports-skeleton";
import { useReportPeriodNavigation } from "@/src/features/reports/components/reports-hub-content";
import { useReportLoader } from "@/src/features/reports/hooks/use-report-loader";
import type { InventoryReport } from "@/src/features/reports/types/reports.types";
import { cn } from "@/src/lib/cn";
import { formatMoney } from "@/src/lib/format-display";
import { operationsApi } from "@/src/services/operations-api";
import { tableCenterCellClass, tableCenterColumnClass } from "@/src/components/ui/table";

function InventoryReportContent() {
  const { periodParams, effectivePeriodParams, setPeriodParams } = useReportPeriodNavigation();
  const [tab, setTab] = useState<"stock" | "alerts" | "activity" | "purchases">("stock");
  const { data: report, loading } = useReportLoader<InventoryReport>(
    () => operationsApi.reports.inventory({ ...effectivePeriodParams, page: 1, limit: 100 }),
    [effectivePeriodParams],
    "Failed to load inventory report",
  );

  const tabs = useMemo(
    () =>
      report
        ? [
            { id: "stock" as const, label: "Current stock", count: report.snapshot.currentStock.length },
            {
              id: "alerts" as const,
              label: "Alerts",
              count: report.snapshot.alerts.counts.low + report.snapshot.alerts.counts.out,
            },
            {
              id: "activity" as const,
              label: "Period activity",
              count: report.periodActivity.items.length,
            },
            {
              id: "purchases" as const,
              label: "Raw purchases",
              count: report.periodActivity.rawMaterialPurchases.length,
            },
          ]
        : [],
    [report],
  );

  const alertItems = report
    ? [...report.snapshot.alerts.out, ...report.snapshot.alerts.low]
    : [];

  const alertCount = report
    ? report.snapshot.alerts.counts.low + report.snapshot.alerts.counts.out
    : 0;

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
            report.snapshot.currentStock.length > 0 ? (
              <ReportSection
                title="Current stock levels"
                description="Live quantities for tracked items."
                count={report.snapshot.currentStock.length}
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
                      {report.snapshot.currentStock.map((item) => (
                        <ListCard
                          key={item.id}
                          title={item.name}
                          badge={<Badge size="sm">{item.kind}</Badge>}
                          fields={[
                            {
                              label: "On hand",
                              value: `${item.quantityOnHand} ${item.unit ?? ""}`.trim(),
                            },
                            { label: "Reorder", value: item.reorderLevel ?? "—" },
                          ]}
                        />
                      ))}
                    </ListCardStack>
                  }
                >
                  {report.snapshot.currentStock.map((item) => (
                    <tr key={item.id}>
                      <td className="font-medium">{item.name}</td>
                      <td className={tableCenterCellClass}>
                        <Badge size="sm">{item.kind}</Badge>
                      </td>
                      <td className={tableCenterCellClass}>
                        {item.quantityOnHand} {item.unit ?? ""}
                      </td>
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
                    </ListCardStack>
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
            report.periodActivity.items.length > 0 ? (
              <ReportSection
                title="Period movement"
                description="Added vs consumed during the selected reporting period."
                count={report.periodActivity.items.length}
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
                      {report.periodActivity.items.map((item) => (
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
                    </ListCardStack>
                  }
                >
                  {report.periodActivity.items.map((item) => (
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
            report.periodActivity.rawMaterialPurchases.length > 0 ? (
              <ReportSection
                title="Raw material purchases"
                description="Purchase totals only — on-hand ingredient tracking is not enabled."
                count={report.periodActivity.rawMaterialPurchases.length}
              >
                <ReportDataTable
                  headers={[
                    "Raw material",
                    { label: "Qty purchased", thClassName: tableCenterColumnClass },
                    { label: "Value", thClassName: tableCenterColumnClass },
                  ]}
                  mobileCards={
                    <ListCardStack>
                      {report.periodActivity.rawMaterialPurchases.map((item) => (
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
                    </ListCardStack>
                  }
                >
                  {report.periodActivity.rawMaterialPurchases.map((item) => (
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
            ) : (
              <EmptyState title="No raw material purchases" description="No purchases in this period." />
            )
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

"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { ChartColumn } from "lucide-react";
import { DateRangeFilter } from "@/src/components/shared/date-range-filter";
import { PageHeader } from "@/src/components/shared/page-header";
import { EmptyState } from "@/src/components/ui/empty-state";
import { Select } from "@/src/components/ui/select";
import { TableSkeleton } from "@/src/components/skeletons/table-skeleton";
import { AssetStatusBadge } from "@/src/components/assets/asset-status-badge";
import { ReportDataTable } from "@/src/features/reports/components/report-data-table";
import { ASSET_STATUS_OPTIONS, type AssetStatus } from "@/src/lib/asset-types";
import { getApiErrorMessage } from "@/src/lib/api-error";
import { formatDateOnly, formatMoney } from "@/src/lib/format-display";
import { cn } from "@/src/lib/cn";
import { appToast } from "@/src/lib/toast";
import { operationsApi } from "@/src/services/operations-api";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { fetchAssetCategoryOptionsThunk } from "@/src/store/slices/reference-data.slice";

type TabId = "register" | "maintenance" | "warranty";

export default function AssetReportsPage() {
  return (
    <section className="page-shell page-content space-y-4">
      <Suspense
        fallback={
          <div className="space-y-4">
            <TableSkeleton columns={5} />
          </div>
        }
      >
        <AssetReportsContent />
      </Suspense>
    </section>
  );
}

function AssetReportsContent() {
  const dispatch = useAppDispatch();
  const categories = useAppSelector((s) => s.referenceData.assetCategoryOptions);

  const [tab, setTab] = useState<TabId>("register");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [registerRows, setRegisterRows] = useState<
    Awaited<ReturnType<typeof operationsApi.assetReports.register>>["rows"]
  >([]);
  const [maintenanceRows, setMaintenanceRows] = useState<
    Awaited<ReturnType<typeof operationsApi.assetReports.maintenance>>["rows"]
  >([]);
  const [warrantyRows, setWarrantyRows] = useState<
    Awaited<ReturnType<typeof operationsApi.assetReports.warranty>>["rows"]
  >([]);

  useEffect(() => {
    void dispatch(fetchAssetCategoryOptionsThunk({}));
  }, [dispatch]);

  const queryParams = {
    assetCategoryId: categoryId || undefined,
    status: status || undefined,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [register, maintenance, warranty] = await Promise.all([
        operationsApi.assetReports.register(queryParams),
        operationsApi.assetReports.maintenance(queryParams),
        operationsApi.assetReports.warranty(queryParams),
      ]);
      setRegisterRows(register.rows);
      setMaintenanceRows(maintenance.rows);
      setWarrantyRows(warranty.rows);
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to load asset reports"));
    } finally {
      setLoading(false);
    }
  }, [categoryId, status, fromDate, toDate]);

  useEffect(() => {
    void load();
  }, [load]);

  const tabs: Array<{ id: TabId; label: string }> = [
    { id: "register", label: "Asset register" },
    { id: "maintenance", label: "Maintenance" },
    { id: "warranty", label: "Warranty" },
  ];

  return (
    <>
      <PageHeader
        title="Asset reports"
        description="Register, maintenance history, and warranty outlook for operational assets."
      />

      <div className="flex flex-wrap gap-2 border-b border-[var(--color-border)] pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              tab === t.id
                ? "bg-[var(--color-primary)] text-white"
                : "text-muted hover:bg-[var(--color-cream-100)]",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-[var(--color-border)] p-3">
        <div className="min-w-[10rem]">
          <label className="mb-1 block text-xs font-medium text-muted">Category</label>
          <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="min-w-[10rem]">
          <label className="mb-1 block text-xs font-medium text-muted">Status</label>
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {ASSET_STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
        </div>
        {tab === "maintenance" ? (
          <DateRangeFilter
            fromDate={fromDate}
            toDate={toDate}
            onFromDateChange={setFromDate}
            onToDateChange={setToDate}
            onApply={() => void load()}
            description="Maintenance date range"
          />
        ) : null}
      </div>

      {loading ? (
        <TableSkeleton columns={5} />
      ) : tab === "register" ? (
        registerRows.length === 0 ? (
          <EmptyState
            title="No assets in register"
            description="Adjust filters or add assets to see the register."
            icon={ChartColumn}
          />
        ) : (
          <ReportDataTable
            headers={[
              "Asset code",
              "Asset name",
              "Category",
              "Purchase date",
              "Purchase cost",
              "Status",
            ]}
          >
            {registerRows.map((row) => (
              <tr key={row.assetCode}>
                <td className="font-mono text-sm">{row.assetCode}</td>
                <td>{row.assetName}</td>
                <td>{row.category}</td>
                <td>{formatDateOnly(row.purchaseDate)}</td>
                <td className="tabular-nums">{formatMoney(row.purchaseCost)}</td>
                <td>
                  <AssetStatusBadge status={row.status as AssetStatus} />
                </td>
              </tr>
            ))}
          </ReportDataTable>
        )
      ) : tab === "maintenance" ? (
        maintenanceRows.length === 0 ? (
          <EmptyState title="No maintenance records" description="No records match your filters." />
        ) : (
          <ReportDataTable
            headers={["Asset", "Maintenance date", "Cost", "Description"]}
          >
            {maintenanceRows.map((row, i) => (
              <tr key={`${row.assetCode}-${row.maintenanceDate}-${i}`}>
                <td>{row.asset}</td>
                <td>{formatDateOnly(row.maintenanceDate)}</td>
                <td className="tabular-nums">{formatMoney(row.cost)}</td>
                <td>{row.description?.trim() || "—"}</td>
              </tr>
            ))}
          </ReportDataTable>
        )
      ) : warrantyRows.length === 0 ? (
        <EmptyState title="No warranty data" description="No assets with warranty dates match your filters." />
      ) : (
        <ReportDataTable headers={["Asset", "Warranty expiry", "Days remaining"]}>
          {warrantyRows.map((row) => (
            <tr key={row.assetCode}>
              <td>{row.asset}</td>
              <td>{formatDateOnly(row.warrantyExpiryDate)}</td>
              <td className="tabular-nums">{row.daysRemaining}</td>
            </tr>
          ))}
        </ReportDataTable>
      )}
    </>
  );
}

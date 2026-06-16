"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Wrench } from "lucide-react";
import { AssetStatusBadge } from "@/src/components/assets/asset-status-badge";
import { EmptyState } from "@/src/components/ui/empty-state";
import { Card } from "@/src/components/ui/card";
import { TableSkeleton } from "@/src/components/skeletons/table-skeleton";
import { ResponsiveTable } from "@/src/components/ui/table";
import type { AssetDetail } from "@/src/lib/asset-types";
import { getApiErrorMessage } from "@/src/lib/api-error";
import { formatDateOnly, formatMoney } from "@/src/lib/format-display";
import { appToast } from "@/src/lib/toast";
import { operationsApi } from "@/src/services/operations-api";

export default function AssetDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [detail, setDetail] = useState<AssetDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await operationsApi.assets.get(id);
      setDetail(data);
    } catch (error) {
      setDetail(null);
      appToast.error(getApiErrorMessage(error, "Failed to load asset"));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <section className="page-shell page-content space-y-4">
        <TableSkeleton columns={4} />
      </section>
    );
  }

  if (!detail) {
    return (
      <section className="page-shell page-content">
        <EmptyState title="Asset not found" description="This asset may have been removed." />
        <Link
          href="/assets"
          className="mt-4 inline-flex h-10 items-center rounded-lg border px-4 text-sm font-medium"
        >
          Back to assets
        </Link>
      </section>
    );
  }

  return (
    <section className="page-shell page-content space-y-6">
      <nav className="flex flex-wrap items-center gap-2 text-sm text-muted">
        <Link href="/assets" className="inline-flex items-center gap-1 hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Assets
        </Link>
        <span>/</span>
        <span className="text-foreground">{detail.assetCode}</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{detail.assetName}</h1>
          <p className="mt-1 font-mono text-sm text-muted">{detail.assetCode}</p>
        </div>
        <Link
          href={`/asset-maintenance?assetId=${detail.id}`}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-[var(--color-primary)] px-4 text-sm font-medium text-white hover:opacity-90"
        >
          <Wrench className="mr-2 h-4 w-4" />
          Add maintenance
        </Link>
      </div>

      <Card className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Category</p>
          <p className="mt-1">{detail.categoryName ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Purchase date</p>
          <p className="mt-1">{formatDateOnly(detail.purchaseDate)}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Purchase cost</p>
          <p className="mt-1 tabular-nums">{formatMoney(detail.purchaseCost)}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Warranty expiry</p>
          <p className="mt-1">
            {detail.warrantyExpiryDate ? formatDateOnly(detail.warrantyExpiryDate) : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Status</p>
          <p className="mt-1">
            <AssetStatusBadge status={detail.status} />
          </p>
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Remarks</p>
          <p className="mt-1">{detail.remarks?.trim() || "—"}</p>
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card density="compact" className="space-y-1 p-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
            Total maintenance records
          </p>
          <p className="text-2xl font-semibold tabular-nums">
            {detail.maintenanceSummary.totalCount}
          </p>
        </Card>
        <Card density="compact" className="space-y-1 p-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
            Total maintenance cost
          </p>
          <p className="text-2xl font-semibold tabular-nums">
            {formatMoney(detail.maintenanceSummary.totalCost)}
          </p>
        </Card>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Maintenance history</h2>
        {detail.maintenanceHistory.length === 0 ? (
          <EmptyState
            title="No maintenance yet"
            description="Record repairs and servicing for this asset."
          />
        ) : (
          <Card className="overflow-hidden p-0">
            <ResponsiveTable
              variant="embedded"
              headers={["Date", "Description", "Cost", "Created by"]}
            >
              {detail.maintenanceHistory.map((row) => (
                <tr key={row.id}>
                  <td>{formatDateOnly(row.maintenanceDate)}</td>
                  <td>{row.description?.trim() || "—"}</td>
                  <td className="tabular-nums">{formatMoney(row.maintenanceCost)}</td>
                  <td>{row.createdBy?.name ?? "—"}</td>
                </tr>
              ))}
            </ResponsiveTable>
          </Card>
        )}
      </div>
    </section>
  );
}

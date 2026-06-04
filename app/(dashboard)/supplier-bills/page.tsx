"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Receipt } from "lucide-react";
import { ListCard, ListCardStack } from "@/src/components/shared/list-card";
import { MobileSortSelect } from "@/src/components/shared/mobile-sort-select";
import { PageHeader } from "@/src/components/shared/page-header";
import { PaginatedListSection } from "@/src/components/shared/paginated-list-section";
import { TableSkeleton } from "@/src/components/skeletons/table-skeleton";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import {
  ResponsiveTable,
  tableActionsCellClass,
  tableActionsColumnClass,
  tableCenterCellClass,
  tableCenterColumnClass,
} from "@/src/components/ui/table";
import { usePaginatedList } from "@/src/hooks/use-paginated-list";
import type { BillSettlementSupplierRow } from "@/src/lib/ap-types";
import { formatDateOnly, formatMoney } from "@/src/lib/format-display";
import { cn } from "@/src/lib/cn";
import { operationsApi } from "@/src/services/operations-api";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { fetchBillSettlementAgingThunk } from "@/src/store/slices/reference-data.slice";

const FILTER_KEYS = ["hasOutstanding", "fullySettled", "activeVendors"] as const;

export default function SupplierBillsPage() {
  return (
    <section className="page-shell page-content space-y-4">
      <Suspense fallback={<TableSkeleton columns={8} />}>
        <SupplierBillsContent />
      </Suspense>
    </section>
  );
}

function SupplierBillsContent() {
  const dispatch = useAppDispatch();
  const aging = useAppSelector((state) => state.referenceData.billSettlementAging);
  const agingStatus = useAppSelector((state) => state.referenceData.billSettlementAgingStatus);

  const defaultSort = useMemo(
    () => ({ sortBy: "outstandingAmount", sortOrder: "desc" as const }),
    [],
  );

  const {
    items,
    meta,
    loading,
    isFetching,
    hasActiveFilters,
    searchInput,
    setSearch,
    clearSearch,
    isSearching,
    searchPlaceholder,
    searchResultSummary,
    setPage,
    setPageSize,
    setSort,
    params,
    setFilters,
  } = usePaginatedList<BillSettlementSupplierRow>({
    queryKey: "bill-settlement",
    fetchFn: (p) =>
      operationsApi.billSettlement.list({
        page: p.page,
        limit: p.limit,
        search: p.search,
        sortBy: p.sortBy as "outstandingAmount" | "lastPurchaseAt" | "name",
        sortOrder: p.sortOrder,
        hasOutstanding: p.hasOutstanding === "true",
        fullySettled: p.fullySettled === "true",
        activeVendors: p.activeVendors === "true",
      }),
    defaultSort,
    filterKeys: [...FILTER_KEYS],
    errorMessage: "Failed to load bill settlement",
    searchPlaceholder: "Search supplier name or phone…",
  });

  useEffect(() => {
    if (agingStatus === "loaded" || agingStatus === "loading") {
      return;
    }
    void dispatch(fetchBillSettlementAgingThunk());
  }, [agingStatus, dispatch]);

  return (
    <>
      <PageHeader
        title="Bill settlement"
        description="Track supplier dues and settle outstanding purchase bills by vendor."
      />

      {aging ? (
        <Card density="compact" className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6 text-sm">
          {[
            { label: "Current", value: aging.totals.current },
            { label: "1–30 days", value: aging.totals.days1_30 },
            { label: "31–60 days", value: aging.totals.days31_60 },
            { label: "61–90 days", value: aging.totals.days61_90 },
            { label: "90+ days", value: aging.totals.days90Plus },
            { label: "Total outstanding", value: aging.totals.totalOutstanding },
          ].map((b) => (
            <div key={b.label}>
              <p className="text-xs text-subtle uppercase tracking-wide">{b.label}</p>
              <p className="font-semibold tabular-nums">{formatMoney(b.value)}</p>
            </div>
          ))}
        </Card>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {[
          { label: "All", clear: true },
          { label: "Has outstanding", hasOutstanding: true },
          { label: "Fully settled", fullySettled: true },
          { label: "Active vendors", activeVendors: true },
        ].map((f) => (
          <Button
            key={f.label}
            type="button"
            size="sm"
            variant={
              f.clear
                ? !params.filters.hasOutstanding &&
                  !params.filters.fullySettled &&
                  !params.filters.activeVendors
                  ? "soft"
                  : "secondary"
                : (f.hasOutstanding && params.filters.hasOutstanding) ||
                    (f.fullySettled && params.filters.fullySettled) ||
                    (f.activeVendors && params.filters.activeVendors)
                  ? "soft"
                  : "secondary"
            }
            onClick={() => {
              if (f.clear) {
                setFilters({});
                return;
              }
              setFilters({
                hasOutstanding: f.hasOutstanding ? "true" : "",
                fullySettled: f.fullySettled ? "true" : "",
                activeVendors: f.activeVendors ? "true" : "",
              });
            }}
          >
            {f.label}
          </Button>
        ))}
      </div>

      <PaginatedListSection
        loading={loading}
        isFetching={isFetching}
        itemsCount={items.length}
        hasActiveFilters={hasActiveFilters}
        searchValue={searchInput}
        onSearchChange={setSearch}
        onSearchClear={clearSearch}
        searchPlaceholder={searchPlaceholder}
        isSearching={isSearching}
        searchResultSummary={searchResultSummary}
        tableColumns={8}
        emptyTitle="No vendor settlement records"
        emptyDescription="Record raw material purchases to start vendor settlement tracking."
        emptyIcon={Receipt}
        onClearFilters={() => {
          clearSearch();
          setFilters({});
        }}
        currentPage={meta.page}
        totalPages={meta.totalPages}
        totalRecords={meta.total}
        pageSize={meta.limit}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        mobileSort={
          <MobileSortSelect
            options={[
              { label: "Outstanding (high)", sortBy: "outstandingAmount", sortOrder: "desc" },
              { label: "Outstanding (low)", sortBy: "outstandingAmount", sortOrder: "asc" },
              { label: "Last purchase", sortBy: "lastPurchaseAt", sortOrder: "desc" },
              { label: "Supplier name", sortBy: "name", sortOrder: "asc" },
            ]}
            currentSortBy={params.sortBy}
            currentSortOrder={params.sortOrder}
            onSort={setSort}
          />
        }
        mobileCards={
          <ListCardStack>
            {items.map((s) => (
              <ListCard
                key={s.id}
                title={s.name}
                subtitle={s.phone ?? "—"}
                fields={[
                  { label: "Outstanding", value: formatMoney(s.outstandingAmount) },
                  { label: "Total purchases", value: formatMoney(s.totalPurchases) },
                  { label: "Open bills", value: String(s.openBillsCount) },
                ]}
                actions={
                  <Link
                    href={`/bill-settlement/${s.id}`}
                    className="inline-flex items-center justify-center rounded-md border border-(--color-border) bg-surface px-3 py-1.5 text-sm font-medium hover:bg-surface-muted"
                  >
                    View
                  </Link>
                }
              />
            ))}
          </ListCardStack>
        }
      >
        <Card density="compact" className="overflow-hidden p-0">
          <ResponsiveTable
            headers={[
              { label: "Supplier" },
              { label: "Phone" },
              { label: "Last purchase" },
              { label: "Open bills", thClassName: tableCenterColumnClass },
              { label: "Total purchases", thClassName: tableCenterColumnClass },
              { label: "Total paid", thClassName: tableCenterColumnClass },
              { label: "Outstanding", thClassName: tableCenterColumnClass },
              { label: "Actions", thClassName: tableActionsColumnClass },
            ]}
            ariaLabel="Bill settlement vendors"
            className="min-w-0 border-0 shadow-none [&_table]:min-w-[64rem]"
          >
            {items.map((s) => (
              <tr key={s.id} className="border-t border-(--color-border)">
                <td className="px-4 py-3 text-sm font-medium">{s.name}</td>
                <td className="px-4 py-3 text-sm text-muted">{s.phone ?? "—"}</td>
                <td className="px-4 py-3 text-sm text-muted">
                  {s.lastPurchaseAt ? formatDateOnly(s.lastPurchaseAt) : "—"}
                </td>
                <td className={cn("px-4 py-3 text-sm tabular-nums", tableCenterCellClass)}>
                  {s.openBillsCount}
                </td>
                <td className={cn("px-4 py-3 text-sm tabular-nums", tableCenterCellClass)}>
                  {formatMoney(s.totalPurchases)}
                </td>
                <td className={cn("px-4 py-3 text-sm tabular-nums", tableCenterCellClass)}>
                  {formatMoney(s.totalPaid)}
                </td>
                <td
                  className={cn(
                    "px-4 py-3 text-sm tabular-nums font-medium",
                    tableCenterCellClass,
                  )}
                >
                  {formatMoney(s.outstandingAmount)}
                </td>
                <td className="px-4 py-3">
                  <div className={tableActionsCellClass}>
                    <Link
                      href={`/bill-settlement/${s.id}`}
                      className="inline-flex items-center justify-center rounded-md border border-(--color-border) bg-surface px-3 py-1.5 text-sm font-medium hover:bg-surface-muted"
                    >
                      View
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </ResponsiveTable>
        </Card>
      </PaginatedListSection>
    </>
  );
}

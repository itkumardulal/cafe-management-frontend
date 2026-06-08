"use client";

import { Suspense } from "react";
import Link from "next/link";
import { PageHeader } from "@/src/components/shared/page-header";
import { PaginatedListSection } from "@/src/components/shared/paginated-list-section";
import { PaginationSkeleton } from "@/src/components/skeletons/pagination-skeleton";
import { TableSkeleton } from "@/src/components/skeletons/table-skeleton";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { ResponsiveTable, tableCenterCellClass, tableCenterColumnClass } from "@/src/components/ui/table";
import { usePaginatedList } from "@/src/hooks/use-paginated-list";
import { formatDateTime } from "@/src/lib/format-display";
import { operationsApi } from "@/src/services/operations-api";

type MovementRow = {
  id: string;
  itemKind: "MENU" | "INVENTORY";
  itemId: string;
  itemName: string;
  delta: string;
  quantityAfter: string;
  sourceType: string;
  sourceId: string | null;
  notes: string | null;
  createdAt: string;
};

function sourceLabel(row: MovementRow) {
  const t = row.sourceType;
  if (t === "SALE") return "POS sale";
  if (t === "STOCK_REMOVAL") return "Stock removal";
  if (t === "OPENING") return "Opening";
  if (t === "ADJUSTMENT_IN") return "Stock in";
  if (t === "DIRECT_PURCHASE") return "Direct purchase";
  return t;
}

export default function StockMovementsPage() {
  return (
    <section className="page-shell page-content space-y-4">
      <Suspense fallback={<TableSkeleton columns={6} />}>
        <MovementsContent />
      </Suspense>
    </section>
  );
}

function MovementsContent() {
  const {
    items,
    meta,
    loading,
    isFetching,
    searchInput,
    setSearch,
    clearSearch,
    isSearching,
    searchPlaceholder,
    searchResultSummary,
    setPage,
    setPageSize,
    hasActiveFilters,
    clearFilters,
  } = usePaginatedList<MovementRow>({
    queryKey: "stock-movements",
    fetchFn: (p) => operationsApi.stockMovements.list(p),
    defaultSort: { sortBy: "createdAt", sortOrder: "desc" },
    errorMessage: "Failed to load movements",
  });

  return (
    <>
      <PageHeader
        title="Stock movements"
        description="Ledger of quantity changes for menu and inventory items."
        action={
          <Link href="/inventory">
            <Button type="button" size="sm" variant="secondary">
              Back to inventory
            </Button>
          </Link>
        }
      />

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
        tableColumns={6}
        emptyTitle="No movements"
        emptyDescription="Stock changes will appear here."
        onClearFilters={clearFilters}
        currentPage={meta.page}
        totalPages={meta.totalPages}
        totalRecords={meta.total}
        pageSize={meta.limit}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      >
        <ResponsiveTable
          headers={[
            "Date",
            "Item",
            { label: "Change", thClassName: tableCenterColumnClass },
            { label: "Balance", thClassName: tableCenterColumnClass },
            "Source",
            "Notes",
          ]}
          ariaLabel="Stock movements"
        >
          {items.map((row) => {
            const delta = Number(row.delta);
            const isPositive = delta > 0;
            return (
              <tr key={row.id} className="border-t border-[var(--color-border)]">
                <td className="px-4 py-3 text-sm">{formatDateTime(row.createdAt)}</td>
                <td className="px-4 py-3 text-sm">
                  {row.itemName}
                  <Badge variant="default" className="ml-2">
                    {row.itemKind === "INVENTORY" ? "Inventory" : "Menu"}
                  </Badge>
                </td>
                <td
                  className={`${tableCenterCellClass} text-sm font-medium tabular-nums ${
                    isPositive ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {isPositive ? "+" : ""}
                  {row.delta}
                </td>
                <td className={`${tableCenterCellClass} text-sm tabular-nums`}>
                  {row.quantityAfter}
                </td>
                <td className="px-4 py-3 text-sm">{sourceLabel(row)}</td>
                <td className="px-4 py-3 text-sm text-muted">{row.notes ?? "—"}</td>
              </tr>
            );
          })}
        </ResponsiveTable>
      </PaginatedListSection>
      {!loading && items.length === 0 ? <PaginationSkeleton /> : null}
    </>
  );
}

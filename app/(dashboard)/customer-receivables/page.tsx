"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { HandCoins } from "lucide-react";
import { FilterSelect } from "@/src/components/shared/filter-select";
import { ListCard, ListCardStack } from "@/src/components/shared/list-card";
import { MobileSortSelect } from "@/src/components/shared/mobile-sort-select";
import { PageHeader } from "@/src/components/shared/page-header";
import { PaginatedListSection } from "@/src/components/shared/paginated-list-section";
import { TableSkeleton } from "@/src/components/skeletons/table-skeleton";
import { Card } from "@/src/components/ui/card";
import {
  ResponsiveTable,
  tableActionsCellClass,
  tableActionsColumnClass,
  tableCenterCellClass,
  tableCenterColumnClass,
} from "@/src/components/ui/table";
import { usePaginatedList } from "@/src/hooks/use-paginated-list";
import type { CustomerReceivableListRow } from "@/src/lib/ar-types";
import { cn } from "@/src/lib/cn";
import { formatDateOnly, formatMoney } from "@/src/lib/format-display";
import { operationsApi } from "@/src/services/operations-api";

const FILTER_KEYS = ["hasOutstanding", "fullySettled", "activeCustomers"] as const;
type CustomerStatusFilter = "" | (typeof FILTER_KEYS)[number];

const actionLinkClass =
  "inline-flex shrink-0 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm font-medium text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-cream-100)] hover:border-[var(--color-input)]";

export default function CustomerReceivablesPage() {
  return (
    <section className="page-shell page-content space-y-4">
      <Suspense fallback={<TableSkeleton columns={7} />}>
        <CustomerReceivablesContent />
      </Suspense>
    </section>
  );
}

function CustomerReceivablesContent() {
  const [statusFilter, setStatusFilter] = useState<CustomerStatusFilter>("");
  const [aging, setAging] = useState<{
    totals: {
      current: number;
      days1_30: number;
      days31_60: number;
      days61_90: number;
      days90Plus: number;
      totalOutstanding: number;
    };
  } | null>(null);

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
    toggleSort,
    setSort,
    params,
    clearFilters,
  } = usePaginatedList<CustomerReceivableListRow>({
    queryKey: "customer-receivables",
    fetchFn: (p) =>
      operationsApi.customerReceivables.list({
        page: p.page,
        limit: p.limit,
        search: p.search,
        sortBy: (p.sortBy as "outstandingAmount" | "lastVisitAt" | "name") ?? "outstandingAmount",
        sortOrder: (p.sortOrder as "asc" | "desc") ?? "desc",
        hasOutstanding: statusFilter === "hasOutstanding" ? true : undefined,
        fullySettled: statusFilter === "fullySettled" ? true : undefined,
        activeCustomers: statusFilter === "activeCustomers" ? true : undefined,
      }),
    defaultSort,
    errorMessage: "Failed to load customer receivables",
    searchPlaceholder: "Search customer name or phone…",
    extraCacheKey: statusFilter,
  });

  useEffect(() => {
    void operationsApi.customerReceivables.agingSummary().then(setAging).catch(() => {});
  }, []);

  const sortOptions = [
    { label: "Outstanding (high)", sortBy: "outstandingAmount", sortOrder: "desc" as const },
    { label: "Outstanding (low)", sortBy: "outstandingAmount", sortOrder: "asc" as const },
    { label: "Last visit (recent)", sortBy: "lastVisitAt", sortOrder: "desc" as const },
    { label: "Name (A–Z)", sortBy: "name", sortOrder: "asc" as const },
  ] as const;

  return (
    <>
      <PageHeader
        title="Customer receivables"
        description="Customer accounts, credit bills, and FIFO settlement."
      />

      {aging ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {[
            ["Current", aging.totals.current],
            ["1–30 days", aging.totals.days1_30],
            ["31–60 days", aging.totals.days31_60],
            ["61–90 days", aging.totals.days61_90],
            ["90+ days", aging.totals.days90Plus],
            ["Total due", aging.totals.totalOutstanding],
          ].map(([label, amount]) => (
            <Card key={label as string} density="compact" className="text-center">
              <p className="text-xs text-muted">{label}</p>
              <p className="font-mono text-sm font-semibold tabular-nums">
                {formatMoney(amount as number)}
              </p>
            </Card>
          ))}
        </div>
      ) : null}

      <PaginatedListSection
        loading={loading}
        isFetching={isFetching}
        itemsCount={items.length}
        hasActiveFilters={hasActiveFilters || Boolean(statusFilter)}
        searchValue={searchInput}
        onSearchChange={setSearch}
        onSearchClear={clearSearch}
        isSearching={isSearching}
        searchPlaceholder={searchPlaceholder}
        searchResultSummary={searchResultSummary}
        filters={
          <FilterSelect
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as CustomerStatusFilter)}
            className="min-w-[10rem]"
          >
            <option value="">All customers</option>
            <option value="hasOutstanding">Has outstanding</option>
            <option value="fullySettled">Fully settled</option>
            <option value="activeCustomers">Active customers</option>
          </FilterSelect>
        }
        mobileSort={
          <MobileSortSelect
            options={[...sortOptions]}
            currentSortBy={params.sortBy}
            currentSortOrder={params.sortOrder}
            onSort={(sortBy, sortOrder) => setSort(sortBy, sortOrder)}
          />
        }
        onClearFilters={() => {
          clearSearch();
          clearFilters();
          setStatusFilter("");
        }}
        currentPage={meta.page}
        totalPages={meta.totalPages}
        totalRecords={meta.total}
        pageSize={meta.limit}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        emptyTitle="No customers found"
        emptyDescription="Try adjusting search or filters."
        emptyIcon={HandCoins}
        tableColumns={8}
        mobileCards={
          <ListCardStack>
            {items.map((row) => (
              <ListCard
                key={row.id}
                title={row.name}
                subtitle={<span className="font-mono tabular-nums">{row.phoneNumber}</span>}
                badge={
                  <span className="font-mono font-semibold tabular-nums tone-warning-text">
                    {formatMoney(row.outstandingAmount)}
                  </span>
                }
                fields={[
                  { label: "Purchases", value: formatMoney(row.totalPurchases) },
                  { label: "Paid", value: formatMoney(row.totalPaid) },
                  { label: "Open bills", value: row.creditBillsCount },
                  {
                    label: "Last visit",
                    value: row.lastVisitAt ? formatDateOnly(row.lastVisitAt) : "—",
                  },
                ]}
                actions={
                  <Link href={`/customer-receivables/${row.id}`} className={actionLinkClass}>
                    View customer
                  </Link>
                }
              />
            ))}
          </ListCardStack>
        }
      >
        <ResponsiveTable
          className="hidden md:block"
          headers={[
            "Customer",
            "Phone",
            { label: "Outstanding", thClassName: tableCenterColumnClass },
            { label: "Purchases", thClassName: tableCenterColumnClass },
            { label: "Paid", thClassName: tableCenterColumnClass },
            { label: "Open bills", thClassName: tableCenterColumnClass },
            "Last visit",
            { label: "Actions", thClassName: cn(tableActionsColumnClass, "w-[1%] whitespace-nowrap") },
          ]}
        >
          {items.map((row) => (
            <tr key={row.id}>
              <td className="font-medium">{row.name}</td>
              <td className="font-mono text-sm tabular-nums">{row.phoneNumber}</td>
              <td className={cn(tableCenterCellClass, "font-mono font-semibold tabular-nums")}>
                {formatMoney(row.outstandingAmount)}
              </td>
              <td className={cn(tableCenterCellClass, "font-mono tabular-nums")}>
                {formatMoney(row.totalPurchases)}
              </td>
              <td className={cn(tableCenterCellClass, "font-mono tabular-nums")}>
                {formatMoney(row.totalPaid)}
              </td>
              <td className={tableCenterCellClass}>{row.creditBillsCount}</td>
              <td>{row.lastVisitAt ? formatDateOnly(row.lastVisitAt) : "—"}</td>
              <td className="whitespace-nowrap px-4 py-3">
                <div className={tableActionsCellClass}>
                  <Link href={`/customer-receivables/${row.id}`} className={actionLinkClass}>
                    View
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </ResponsiveTable>
      </PaginatedListSection>
    </>
  );
}

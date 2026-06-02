"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Receipt } from "lucide-react";
import { BillStatusBadge, PaymentStatusBadge } from "@/src/components/purchases/ap-status-badges";
import { ListCard, ListCardStack } from "@/src/components/shared/list-card";
import { MobileSortSelect } from "@/src/components/shared/mobile-sort-select";
import { PageHeader } from "@/src/components/shared/page-header";
import { PaginatedListSection } from "@/src/components/shared/paginated-list-section";
import { PaginationSkeleton } from "@/src/components/skeletons/pagination-skeleton";
import { TableSkeleton } from "@/src/components/skeletons/table-skeleton";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { ResponsiveTable, tableActionsCellClass, tableActionsColumnClass, tableCenterCellClass, tableCenterColumnClass } from "@/src/components/ui/table";
import { SortableTableHeader } from "@/src/components/ui/sortable-table-header";
import { usePaginatedList } from "@/src/hooks/use-paginated-list";
import type { ApBillSummary } from "@/src/lib/ap-types";
import { formatMoney, formatDateOnly } from "@/src/lib/format-display";
import { cn } from "@/src/lib/cn";
import { operationsApi } from "@/src/services/operations-api";

const FILTER_KEYS = ["supplierId", "billStatus", "paymentStatus"] as const;

export default function SupplierBillsPage() {
  return (
    <section className="page-shell page-content space-y-4">
      <Suspense fallback={<TableSkeleton columns={10} />}>
        <SupplierBillsContent />
      </Suspense>
    </section>
  );
}

function SupplierBillsContent() {
  const searchParams = useSearchParams();
  const [aging, setAging] = useState<{
    totals: { current: number; days1_30: number; days31_60: number; days61_90: number; days90Plus: number; totalOutstanding: number };
  } | null>(null);

  const defaultSort = useMemo(() => ({ sortBy: "purchaseDate", sortOrder: "desc" as const }), []);

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
    setFilters,
    refetch,
  } = usePaginatedList<ApBillSummary>({
    queryKey: "supplier-bills",
    fetchFn: (p) => {
      const dueWithinRaw = searchParams.get("dueWithinDays");
      const dueWithinDays =
        dueWithinRaw && Number.isFinite(Number(dueWithinRaw)) ? Number(dueWithinRaw) : undefined;

      return operationsApi.supplierBills.list({
        page: p.page,
        limit: p.limit,
        search: p.search,
        sortBy: p.sortBy,
        sortOrder: p.sortOrder,
        supplierId: typeof p.supplierId === "string" ? p.supplierId : undefined,
        billStatus: typeof p.billStatus === "string" ? p.billStatus : undefined,
        paymentStatus: typeof p.paymentStatus === "string" ? p.paymentStatus : undefined,
        fromDate: typeof p.fromDate === "string" ? p.fromDate : undefined,
        toDate: typeof p.toDate === "string" ? p.toDate : undefined,
        dueWithinDays,
        hasOutstanding: searchParams.get("hasOutstanding") === "true" ? "true" : undefined,
      });
    },
    defaultSort,
    filterKeys: [...FILTER_KEYS],
    errorMessage: "Failed to load supplier bills",
    searchPlaceholder: "Search receipt, supplier, or invoice…",
  });

  useEffect(() => {
    void operationsApi.supplierBills.agingSummary().then(setAging).catch(() => {});
  }, []);

  return (
    <>
      <PageHeader
        title="Supplier bills"
        description="Track supplier dues, record payments, and monitor overdue balances."
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
          { label: "Open", billStatus: "OPEN" },
          { label: "Overdue", billStatus: "OVERDUE" },
          { label: "Unpaid", paymentStatus: "UNPAID" },
        ].map((f) => (
          <Button
            key={f.label}
            type="button"
            size="sm"
            variant={
              f.clear
                ? !params.filters.billStatus && !params.filters.paymentStatus
                  ? "soft"
                  : "secondary"
                : params.filters.billStatus === f.billStatus ||
                    params.filters.paymentStatus === f.paymentStatus
                  ? "soft"
                  : "secondary"
            }
            onClick={() => {
              if (f.clear) {
                setFilters({});
              } else if (f.billStatus) {
                setFilters({ billStatus: f.billStatus });
              } else if (f.paymentStatus) {
                setFilters({ paymentStatus: f.paymentStatus });
              }
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
        tableColumns={10}
        emptyTitle="No supplier bills"
        emptyDescription="Record a raw material purchase to create supplier bills."
        emptyIcon={Receipt}
        currentPage={meta.page}
        totalPages={meta.totalPages}
        totalRecords={meta.total}
        pageSize={meta.limit}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        mobileSort={
          <MobileSortSelect
            options={[
              { label: "Purchase date (newest)", sortBy: "purchaseDate", sortOrder: "desc" },
              { label: "Due date", sortBy: "dueDate", sortOrder: "asc" },
              { label: "Remaining (high)", sortBy: "remainingAmount", sortOrder: "desc" },
            ]}
            currentSortBy={params.sortBy}
            currentSortOrder={params.sortOrder}
            onSort={setSort}
          />
        }
        mobileCards={
          <ListCardStack>
            {items.map((b) => (
              <ListCard
                key={b.id}
                title={b.receiptNo}
                subtitle={b.supplierName ?? "—"}
                badge={
                  <div className="flex flex-wrap gap-1">
                    <BillStatusBadge status={b.billStatus} />
                    <PaymentStatusBadge status={b.paymentStatus} />
                  </div>
                }
                fields={[
                  { label: "Total", value: formatMoney(b.grandTotal) },
                  { label: "Remaining", value: formatMoney(b.remainingAmount) },
                  { label: "Due", value: b.dueDate ? formatDateOnly(b.dueDate) : "—" },
                ]}
                actions={
                  <Link
                    href={`/supplier-bills/${b.id}`}
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
              { label: "Purchase no", thClassName: tableCenterColumnClass },
              { label: "Supplier" },
              { label: "Purchase date" },
              { label: "Due date" },
              { label: "Total", thClassName: tableCenterColumnClass },
              { label: "Paid", thClassName: tableCenterColumnClass },
              { label: "Remaining", thClassName: tableCenterColumnClass },
              { label: "Payment", thClassName: tableCenterColumnClass },
              { label: "Status", thClassName: tableCenterColumnClass },
              { label: "Actions", thClassName: tableActionsColumnClass },
            ]}
            ariaLabel="Supplier bills"
            className="min-w-0 border-0 shadow-none [&_table]:min-w-[64rem]"
          >
            {items.map((b) => (
              <tr key={b.id} className="border-t border-(--color-border)">
                <td className={cn("px-4 py-3 text-sm font-medium", tableCenterCellClass)}>{b.receiptNo}</td>
                <td className="px-4 py-3 text-sm">{b.supplierName ?? "—"}</td>
                <td className="px-4 py-3 text-sm text-muted">{formatDateOnly(b.purchaseDate)}</td>
                <td className="px-4 py-3 text-sm text-muted">{b.dueDate ? formatDateOnly(b.dueDate) : "—"}</td>
                <td className={cn("px-4 py-3 text-sm tabular-nums", tableCenterCellClass)}>{formatMoney(b.grandTotal)}</td>
                <td className={cn("px-4 py-3 text-sm tabular-nums", tableCenterCellClass)}>{formatMoney(b.paidAmount)}</td>
                <td className={cn("px-4 py-3 text-sm tabular-nums font-medium", tableCenterCellClass)}>{formatMoney(b.remainingAmount)}</td>
                <td className={cn("px-4 py-3", tableCenterCellClass)}><PaymentStatusBadge status={b.paymentStatus} /></td>
                <td className={cn("px-4 py-3", tableCenterCellClass)}><BillStatusBadge status={b.billStatus} /></td>
                <td className="px-4 py-3">
                  <div className={tableActionsCellClass}>
                    <Link
                      href={`/supplier-bills/${b.id}`}
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

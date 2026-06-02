"use client";

import { Suspense, useState } from "react";
import { Eye, Printer, ScanLine } from "lucide-react";
import { FilterDrawer } from "@/src/components/shared/filter-drawer";
import { ListCard, ListCardStack } from "@/src/components/shared/list-card";
import { MobileSortSelect } from "@/src/components/shared/mobile-sort-select";
import { PaginatedListSection } from "@/src/components/shared/paginated-list-section";
import { Pagination } from "@/src/components/ui/pagination";
import { SortableTableHeader } from "@/src/components/ui/sortable-table-header";
import {
  ResponsiveTable,
  tableActionsCellClass,
  tableActionsColumnClass,
  tableCenterCellClass,
  tableCenterColumnClass,
} from "@/src/components/ui/table";
import { Button } from "@/src/components/ui/button";
import { usePaginatedList } from "@/src/hooks/use-paginated-list";
import { cn } from "@/src/lib/cn";
import { formatDateTime, formatMoney } from "@/src/lib/format-display";
import { operationsApi } from "@/src/services/operations-api";

type SaleRow = {
  id: string;
  receiptNo: string;
  saleAt: string;
  serviceType: "DINE_IN" | "DELIVERY";
  billingType: "PAID" | "CREDIT";
  paymentStatus?: "PAID" | "PARTIAL" | "UNPAID";
  tableName?: string | null;
  grandTotal: string;
  remainingAmount?: string;
  lineCount: number;
};

type ServiceFilter = "" | "DINE_IN" | "DELIVERY";
type BillingFilter = "" | "PAID" | "CREDIT";

function chipClass(active: boolean) {
  return cn(
    "shrink-0 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
    active
      ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-nav-active-text)] shadow-sm"
      : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-nav-idle)] hover:border-[var(--color-input)] hover:bg-[var(--color-cream-100)] hover:text-[var(--color-nav-idle-hover)]",
  );
}

function serviceLabel(type: SaleRow["serviceType"]) {
  return type === "DINE_IN" ? "Dine in" : "Delivery";
}

function tableCell(row: SaleRow) {
  if (row.serviceType === "DELIVERY") return "—";
  return row.tableName?.trim() || "—";
}

function billingLabel(type: SaleRow["billingType"]) {
  return type === "PAID" ? "Paid" : "Credit";
}

function PosRecentSalesContent({
  onView,
  onPrint,
}: {
  onView: (id: string) => void;
  onPrint: (id: string) => void;
}) {
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [draftServiceFilter, setDraftServiceFilter] = useState<ServiceFilter>("");
  const [draftBillingFilter, setDraftBillingFilter] = useState<BillingFilter>("");
  const [draftOpenBalance, setDraftOpenBalance] = useState(false);

  const {
    items: sales,
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
    setFilter,
    clearFilters,
  } = usePaginatedList<SaleRow>({
    queryKey: "pos-sales",
    fetchFn: (p) => {
      const { salesServiceType, salesBillingType, salesHasBalance, ...rest } = p;
      return operationsApi.sales.list({
        ...rest,
        serviceType: (salesServiceType as ServiceFilter | undefined) || undefined,
        billingType: (salesBillingType as BillingFilter | undefined) || undefined,
        hasBalance: salesHasBalance === "true" ? true : undefined,
      });
    },
    defaultSort: { sortBy: "saleAt", sortOrder: "desc" },
    filterKeys: ["salesServiceType", "salesBillingType", "salesHasBalance"],
    urlConfig: {
      pageKey: "salesPage",
      limitKey: "salesLimit",
      searchKey: "salesSearch",
      sortByKey: "salesSortBy",
      sortOrderKey: "salesSortOrder",
      filterKeys: ["salesServiceType", "salesBillingType", "salesHasBalance"],
    },
    errorMessage: "Failed to load sales",
  });

  const serviceFilter = (params.filters.salesServiceType ?? "") as ServiceFilter;
  const billingFilter = (params.filters.salesBillingType ?? "") as BillingFilter;
  const openBalanceFilter = params.filters.salesHasBalance === "true";

  const applyFilters = () => {
    setFilter("salesServiceType", draftServiceFilter);
    setFilter("salesBillingType", draftBillingFilter);
    setFilter("salesHasBalance", draftOpenBalance ? "true" : "");
  };

  const hasDrawerFilters = Boolean(serviceFilter || billingFilter || openBalanceFilter);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Recent sales</h2>
          <p className="text-xs text-muted">Latest completed orders</p>
        </div>
        <div className="hidden flex-col gap-2 md:flex">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted">Service</span>
            {(["", "DINE_IN", "DELIVERY"] as const).map((f) => (
              <button
                key={f || "all-service"}
                type="button"
                onClick={() => setFilter("salesServiceType", f)}
                className={chipClass(serviceFilter === f)}
              >
                {f === "" ? "All" : f === "DINE_IN" ? "Dine in" : "Delivery"}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted">Payment</span>
            {(["", "PAID", "CREDIT"] as const).map((f) => (
              <button
                key={f || "all-billing"}
                type="button"
                onClick={() => setFilter("salesBillingType", f)}
                className={chipClass(billingFilter === f)}
              >
                {f === "" ? "All" : f === "PAID" ? "Paid" : "Credit"}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setFilter("salesHasBalance", openBalanceFilter ? "" : "true")}
              className={chipClass(openBalanceFilter)}
            >
              Open balance
            </button>
          </div>
        </div>
      </div>

      <PaginatedListSection
        loading={loading}
        isFetching={isFetching}
        itemsCount={sales.length}
        hasActiveFilters={hasActiveFilters}
        searchValue={searchInput}
        onSearchChange={setSearch}
        onSearchClear={clearSearch}
        searchPlaceholder={searchPlaceholder}
        isSearching={isSearching}
        searchResultSummary={searchResultSummary}
        tableColumns={9}
        emptyTitle="No POS Orders Found"
        emptyDescription="Completed sales will appear here."
        emptyIcon={ScanLine}
        onClearFilters={() => {
          clearSearch();
          clearFilters();
        }}
        currentPage={meta.page}
        totalPages={meta.totalPages}
        totalRecords={meta.total}
        pageSize={meta.limit}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        filters={
          <FilterDrawer
            open={filterDrawerOpen}
            onOpenChange={(open) => {
              setFilterDrawerOpen(open);
              if (open) {
                setDraftServiceFilter(serviceFilter);
                setDraftBillingFilter(billingFilter);
                setDraftOpenBalance(openBalanceFilter);
              }
            }}
            hasActiveFilters={hasDrawerFilters}
            onApply={applyFilters}
            onReset={() => {
              setDraftServiceFilter("");
              setDraftBillingFilter("");
              setDraftOpenBalance(false);
              setFilter("salesServiceType", "");
              setFilter("salesBillingType", "");
              setFilter("salesHasBalance", "");
            }}
            title="Filter orders"
          >
            <p className="mb-2 text-sm font-medium text-[var(--color-foreground)]">Service type</p>
            <div className="mb-4 flex flex-wrap gap-2">
              {(["", "DINE_IN", "DELIVERY"] as const).map((f) => (
                <button
                  key={f || "all-service"}
                  type="button"
                  onClick={() => setDraftServiceFilter(f)}
                  className={chipClass(draftServiceFilter === f)}
                >
                  {f === "" ? "All" : f === "DINE_IN" ? "Dine in" : "Delivery"}
                </button>
              ))}
            </div>
            <p className="mb-2 text-sm font-medium text-[var(--color-foreground)]">Payment type</p>
            <div className="flex flex-wrap gap-2">
              {(["", "PAID", "CREDIT"] as const).map((f) => (
                <button
                  key={f || "all-billing"}
                  type="button"
                  onClick={() => setDraftBillingFilter(f)}
                  className={chipClass(draftBillingFilter === f)}
                >
                  {f === "" ? "All" : f === "PAID" ? "Paid" : "Credit"}
                </button>
              ))}
            </div>
          </FilterDrawer>
        }
        mobileSort={
          <MobileSortSelect
            options={[
              { label: "Date (newest)", sortBy: "saleAt", sortOrder: "desc" },
              { label: "Date (oldest)", sortBy: "saleAt", sortOrder: "asc" },
              { label: "Receipt (A–Z)", sortBy: "receiptNo", sortOrder: "asc" },
            ]}
            currentSortBy={params.sortBy}
            currentSortOrder={params.sortOrder}
            onSort={setSort}
          />
        }
        mobileCards={
          <ListCardStack>
            {sales.map((s) => (
              <ListCard
                key={s.id}
                title={s.receiptNo}
                subtitle={formatDateTime(s.saleAt)}
                fields={[
                  { label: "Service", value: serviceLabel(s.serviceType) },
                  { label: "Table", value: tableCell(s) },
                  { label: "Payment", value: billingLabel(s.billingType) },
                  ...(Number(s.remainingAmount) > 0.005
                    ? [{ label: "Due", value: formatMoney(s.remainingAmount!) }]
                    : []),
                  { label: "Items", value: String(s.lineCount) },
                  { label: "Total", value: formatMoney(s.grandTotal) },
                ]}
                actions={
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" size="sm" variant="secondary" onClick={() => onView(s.id)}>
                      <span className="inline-flex items-center gap-1.5">
                        <Eye size={15} strokeWidth={1.75} aria-hidden />
                        View
                      </span>
                    </Button>
                    <Button type="button" size="sm" variant="secondary" onClick={() => onPrint(s.id)}>
                      <span className="inline-flex items-center gap-1.5">
                        <Printer size={15} strokeWidth={1.75} aria-hidden />
                        Print
                      </span>
                    </Button>
                  </div>
                }
              />
            ))}
          </ListCardStack>
        }
      >
        <ResponsiveTable
          headers={[
            {
              label: "Receipt",
              thClassName: tableCenterColumnClass,
              headerContent: (
                <SortableTableHeader
                  label="Receipt"
                  sortKey="receiptNo"
                  currentSortBy={params.sortBy}
                  currentSortOrder={params.sortOrder}
                  onSort={toggleSort}
                  align="center"
                />
              ),
            },
            {
              label: "Date",
              headerContent: (
                <SortableTableHeader
                  label="Date"
                  sortKey="saleAt"
                  currentSortBy={params.sortBy}
                  currentSortOrder={params.sortOrder}
                  onSort={toggleSort}
                />
              ),
            },
            { label: "Service", thClassName: tableCenterColumnClass },
            { label: "Table", thClassName: tableCenterColumnClass },
            { label: "Payment", thClassName: tableCenterColumnClass },
            { label: "Due", thClassName: tableCenterColumnClass },
            { label: "Items", thClassName: tableCenterColumnClass },
            { label: "Total", thClassName: tableCenterColumnClass },
            { label: "Actions", thClassName: tableActionsColumnClass },
          ]}
          ariaLabel="Recent sales"
          density="compact"
          className="min-w-0 border-0 shadow-none [&_table]:min-w-[58rem]"
        >
          {sales.map((s) => (
            <tr key={s.id} className="border-t border-[var(--color-border)]">
              <td className={cn("px-4 py-3 font-mono text-sm font-medium text-foreground whitespace-nowrap", tableCenterCellClass)}>
                {s.receiptNo}
              </td>
              <td className="px-4 py-3 text-sm text-muted whitespace-nowrap">{formatDateTime(s.saleAt)}</td>
              <td className={cn("px-4 py-3 text-sm text-muted", tableCenterCellClass)}>
                {serviceLabel(s.serviceType)}
              </td>
              <td className={cn("px-4 py-3 text-sm text-muted", tableCenterCellClass)}>
                {tableCell(s)}
              </td>
              <td className={cn("px-4 py-3 text-sm text-muted", tableCenterCellClass)}>
                {billingLabel(s.billingType)}
              </td>
              <td className={cn("px-4 py-3 text-sm font-mono tabular-nums", tableCenterCellClass)}>
                {Number(s.remainingAmount) > 0.005 ? formatMoney(s.remainingAmount!) : "—"}
              </td>
              <td className={cn("px-4 py-3 text-sm text-muted", tableCenterCellClass)}>{s.lineCount}</td>
              <td className={cn("px-4 py-3 text-sm font-medium text-foreground", tableCenterCellClass)}>
                {formatMoney(s.grandTotal)}
              </td>
              <td className="px-4 py-3">
                <div className={tableActionsCellClass}>
                  <div className="inline-flex flex-nowrap items-center justify-center gap-1.5">
                    <Button type="button" size="sm" variant="secondary" onClick={() => onView(s.id)}>
                      <span className="inline-flex items-center gap-1.5">
                        <Eye size={15} strokeWidth={1.75} aria-hidden />
                        View
                      </span>
                    </Button>
                    <Button type="button" size="sm" variant="secondary" onClick={() => onPrint(s.id)}>
                      <span className="inline-flex items-center gap-1.5">
                        <Printer size={15} strokeWidth={1.75} aria-hidden />
                        Print
                      </span>
                    </Button>
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </ResponsiveTable>
      </PaginatedListSection>
    </div>
  );
}

export function PosRecentSales({
  onView,
  onPrint,
}: {
  onView: (id: string) => void;
  onPrint: (id: string) => void;
}) {
  return (
    <Suspense
      fallback={
        <div className="space-y-3">
          <Pagination
            currentPage={1}
            totalPages={1}
            totalRecords={0}
            pageSize={20}
            onPageChange={() => undefined}
            onPageSizeChange={() => undefined}
            loading
          />
        </div>
      }
    >
      <PosRecentSalesContent onView={onView} onPrint={onPrint} />
    </Suspense>
  );
}

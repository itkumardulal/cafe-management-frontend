"use client";

import { Suspense, useCallback, useMemo, useState } from "react";
import { Eye, FileText, Printer, ScanLine } from "lucide-react";
import { FilterDrawer } from "@/src/components/shared/filter-drawer";
import { SalePaymentStatusBadge } from "@/src/components/sales/ar-status-badges";
import { InvoicesQuickFilters } from "@/src/features/invoices/components/invoices-quick-filters";
import { InvoicesSummaryStrip } from "@/src/features/invoices/components/invoices-summary-strip";
import { ReportPeriodFilter } from "@/src/features/reports/components/report-period-filter";
import {
  buildReportQueryParams,
  type ReportPeriodKey,
  type ReportPeriodParams,
} from "@/src/features/reports/types/reports.types";
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
import { Badge } from "@/src/components/ui/badge";
import { Card } from "@/src/components/ui/card";
import { usePaginatedList } from "@/src/hooks/use-paginated-list";
import { serviceLabel } from "@/src/features/printing/lib/pos-labels";
import { cn } from "@/src/lib/cn";
import { formatDateTime, formatMoney } from "@/src/lib/format-display";
import { operationsApi } from "@/src/services/operations-api";
import type { SalePaymentStatus } from "@/src/lib/ar-types";

type SaleRow = {
  id: string;
  receiptNo: string;
  saleAt: string;
  serviceType: "DINE_IN" | "DELIVERY";
  billingType: "PAID" | "CREDIT";
  paymentStatus?: SalePaymentStatus;
  tableName?: string | null;
  grandTotal: string;
  changeAmount?: string;
  remainingAmount?: string;
  lineCount: number;
};

type ServiceFilter = "" | "DINE_IN" | "DELIVERY";
type BillingFilter = "" | "PAID" | "CREDIT";
type PaymentChannelFilter = "" | "CASH" | "BANK";

const DEFAULT_PERIOD_BY_VARIANT: Record<"default" | "invoices", ReportPeriodKey> = {
  default: "this_month",
  invoices: "today",
};

function periodToFilters(
  existing: Record<string, string>,
  next: ReportPeriodParams,
  defaultPeriod: ReportPeriodKey,
): Record<string, string> {
  const filters: Record<string, string> = {
    ...existing,
    period: next.period ?? defaultPeriod,
  };
  if (next.period === "custom") {
    if (next.fromDate) {
      filters.fromDate = next.fromDate;
    } else {
      delete filters.fromDate;
    }
    if (next.toDate) {
      filters.toDate = next.toDate;
    } else {
      delete filters.toDate;
    }
  } else {
    delete filters.fromDate;
    delete filters.toDate;
  }
  return filters;
}

function chipClass(active: boolean) {
  return cn(
    "shrink-0 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
    active
      ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-nav-active-text)] shadow-sm"
      : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-nav-idle)] hover:border-[var(--color-input)] hover:bg-[var(--color-cream-100)] hover:text-[var(--color-nav-idle-hover)]",
  );
}

function tableCell(row: SaleRow) {
  if (row.serviceType === "DELIVERY") return "—";
  return row.tableName?.trim() || "—";
}

function billingLabel(type: SaleRow["billingType"]) {
  return type === "PAID" ? "Paid" : "Credit";
}

function paymentBadge(row: SaleRow) {
  if (row.billingType === "CREDIT" && row.paymentStatus) {
    return <SalePaymentStatusBadge status={row.paymentStatus} />;
  }
  return (
    <Badge variant="success" size="sm">
      Paid
    </Badge>
  );
}

function serviceBadge(type: SaleRow["serviceType"]) {
  return (
    <Badge variant="default" size="sm">
      {serviceLabel(type)}
    </Badge>
  );
}

function PosRecentSalesContent({
  onView,
  onPrint,
  queryKey = "invoices",
  variant = "default",
  title,
  description,
  emptyTitle = "No invoices yet",
  emptyDescription = "Completed sales from POS will appear here.",
}: {
  onView: (id: string) => void;
  onPrint: (id: string) => void;
  queryKey?: string;
  variant?: "default" | "invoices";
  title?: string;
  description?: string;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const isInvoicesLayout = variant === "invoices";
  const defaultPeriod = DEFAULT_PERIOD_BY_VARIANT[variant];
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [draftServiceFilter, setDraftServiceFilter] = useState<ServiceFilter>("");
  const [draftBillingFilter, setDraftBillingFilter] = useState<BillingFilter>("");
  const [draftPaymentChannelFilter, setDraftPaymentChannelFilter] =
    useState<PaymentChannelFilter>("");
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
    setFilters,
  } = usePaginatedList<SaleRow>({
    queryKey,
    fetchFn: (p) => {
      const {
        salesServiceType,
        salesBillingType,
        salesPaymentChannel,
        salesHasBalance,
        period,
        fromDate,
        toDate,
        ...rest
      } = p;
      const periodQuery = buildReportQueryParams({
        period: (period as ReportPeriodKey | undefined) || defaultPeriod,
        fromDate: typeof fromDate === "string" ? fromDate : undefined,
        toDate: typeof toDate === "string" ? toDate : undefined,
      });
      const paymentChannel = salesPaymentChannel as PaymentChannelFilter | undefined;
      return operationsApi.sales.list({
        ...rest,
        ...periodQuery,
        serviceType: (salesServiceType as ServiceFilter | undefined) || undefined,
        billingType: (salesBillingType as BillingFilter | undefined) || undefined,
        paymentChannel: paymentChannel === "CASH" || paymentChannel === "BANK" ? paymentChannel : undefined,
        hasBalance: salesHasBalance === "true" ? true : undefined,
      });
    },
    defaultSort: { sortBy: "saleAt", sortOrder: "desc" },
    filterKeys: [
      "period",
      "fromDate",
      "toDate",
      "salesServiceType",
      "salesBillingType",
      "salesPaymentChannel",
      "salesHasBalance",
    ],
    urlConfig: {
      pageKey: "salesPage",
      limitKey: "salesLimit",
      searchKey: "salesSearch",
      sortByKey: "salesSortBy",
      sortOrderKey: "salesSortOrder",
      filterKeys: [
        "period",
        "fromDate",
        "toDate",
        "salesServiceType",
        "salesBillingType",
        "salesPaymentChannel",
        "salesHasBalance",
      ],
    },
    errorMessage: "Failed to load sales",
  });

  const serviceFilter = (params.filters.salesServiceType ?? "") as ServiceFilter;
  const billingFilter = (params.filters.salesBillingType ?? "") as BillingFilter;
  const paymentChannelFilter = (params.filters.salesPaymentChannel ?? "") as PaymentChannelFilter;
  const openBalanceFilter = params.filters.salesHasBalance === "true";

  const periodParams = useMemo<ReportPeriodParams>(
    () => ({
      period: (params.filters.period as ReportPeriodKey | undefined) ?? defaultPeriod,
      fromDate: params.filters.fromDate,
      toDate: params.filters.toDate,
    }),
    [defaultPeriod, params.filters.period, params.filters.fromDate, params.filters.toDate],
  );

  const handlePeriodChange = useCallback(
    (next: ReportPeriodParams) => {
      setFilters(periodToFilters(params.filters, next, defaultPeriod));
    },
    [defaultPeriod, params.filters, setFilters],
  );

  const resetListFilters = useCallback(() => {
    setFilters({
      period: defaultPeriod,
      salesServiceType: "",
      salesBillingType: "",
      salesPaymentChannel: "",
      salesHasBalance: "",
    });
  }, [defaultPeriod, setFilters]);

  const applyFilters = () => {
    setFilters({
      ...params.filters,
      salesServiceType: draftServiceFilter,
      salesBillingType: draftBillingFilter,
      salesPaymentChannel: draftPaymentChannelFilter,
      salesHasBalance: draftOpenBalance ? "true" : "",
    });
  };

  const hasPeriodFilter = Boolean(
    params.filters.period && params.filters.period !== defaultPeriod,
  );
  const hasListActiveFilters = hasActiveFilters || hasPeriodFilter;
  const hasDrawerFilters = Boolean(
    serviceFilter ||
      billingFilter ||
      paymentChannelFilter ||
      openBalanceFilter ||
      hasPeriodFilter,
  );

  const pageRevenue = useMemo(
    () => sales.reduce((sum, row) => sum + Number(row.grandTotal || 0), 0),
    [sales],
  );

  const pageChangeReturned = useMemo(
    () => sales.reduce((sum, row) => sum + Number(row.changeAmount || 0), 0),
    [sales],
  );

  const openBalanceCount = useMemo(
    () => sales.filter((row) => Number(row.remainingAmount) > 0.005).length,
    [sales],
  );

  const periodFilterBlock = (
    <ReportPeriodFilter
      period={periodParams}
      onPeriodChange={handlePeriodChange}
      compact={!isInvoicesLayout}
    />
  );

  const quickFiltersBlock = (
    <InvoicesQuickFilters
      serviceFilter={serviceFilter}
      billingFilter={billingFilter}
      paymentChannelFilter={paymentChannelFilter}
      openBalanceFilter={openBalanceFilter}
      onServiceChange={(value) => setFilter("salesServiceType", value)}
      onBillingChange={(value) => setFilter("salesBillingType", value)}
      onPaymentChannelChange={(value) => setFilter("salesPaymentChannel", value)}
      onOpenBalanceToggle={() =>
        setFilter("salesHasBalance", openBalanceFilter ? "" : "true")
      }
      className={isInvoicesLayout ? undefined : "hidden md:flex"}
    />
  );

  const listSection = (
    <PaginatedListSection
      loading={loading}
      isFetching={isFetching}
      itemsCount={sales.length}
      hasActiveFilters={hasListActiveFilters}
      searchValue={searchInput}
      onSearchChange={setSearch}
      onSearchClear={clearSearch}
      searchPlaceholder={
        isInvoicesLayout ? "Search receipt or customer…" : searchPlaceholder
      }
      isSearching={isSearching}
      searchResultSummary={searchResultSummary}
      tableColumns={9}
      emptyTitle={emptyTitle}
      emptyDescription={emptyDescription}
      emptyIcon={isInvoicesLayout ? FileText : ScanLine}
      onClearFilters={() => {
        clearSearch();
        resetListFilters();
      }}
      currentPage={meta.page}
      totalPages={meta.totalPages}
      totalRecords={meta.total}
      pageSize={meta.limit}
      onPageChange={setPage}
      onPageSizeChange={setPageSize}
      toolbar={
        isInvoicesLayout ? (
          <div className="space-y-3">
            {quickFiltersBlock}
          </div>
        ) : undefined
      }
      filters={
        <FilterDrawer
          open={filterDrawerOpen}
          onOpenChange={(open) => {
            setFilterDrawerOpen(open);
            if (open) {
              setDraftServiceFilter(serviceFilter);
              setDraftBillingFilter(billingFilter);
              setDraftPaymentChannelFilter(paymentChannelFilter);
              setDraftOpenBalance(openBalanceFilter);
            }
          }}
          hasActiveFilters={hasDrawerFilters}
          onApply={applyFilters}
          onReset={() => {
            setDraftServiceFilter("");
            setDraftBillingFilter("");
            setDraftPaymentChannelFilter("");
            setDraftOpenBalance(false);
            resetListFilters();
          }}
          title={isInvoicesLayout ? "Filter invoices" : "Filter orders"}
        >
          <ReportPeriodFilter
            period={periodParams}
            onPeriodChange={handlePeriodChange}
            compact
          />
          <p className="mb-2 mt-4 text-sm font-medium text-[var(--color-foreground)]">Service type</p>
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
          <p className="mb-2 text-sm font-medium text-[var(--color-foreground)]">Tender</p>
          <div className="mb-4 flex flex-wrap gap-2">
            {(["", "CASH", "BANK"] as const).map((f) => (
              <button
                key={f || "all-tender"}
                type="button"
                onClick={() => setDraftPaymentChannelFilter(f)}
                className={chipClass(draftPaymentChannelFilter === f)}
              >
                {f === "" ? "All" : f === "CASH" ? "Cash" : "Bank"}
              </button>
            ))}
          </div>
          <p className="mb-2 text-sm font-medium text-[var(--color-foreground)]">Billing</p>
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
              badge={isInvoicesLayout ? paymentBadge(s) : undefined}
              fields={[
                {
                  label: "Service",
                  value: isInvoicesLayout ? serviceBadge(s.serviceType) : serviceLabel(s.serviceType),
                  layout: isInvoicesLayout ? "stack" : "inline",
                },
                { label: "Table", value: tableCell(s) },
                ...(isInvoicesLayout
                  ? []
                  : [{ label: "Payment", value: billingLabel(s.billingType) }]),
                ...(Number(s.remainingAmount) > 0.005
                  ? [
                      {
                        label: "Due",
                        value: (
                          <span className="font-medium tone-warning-text tabular-nums">
                            {formatMoney(s.remainingAmount!)}
                          </span>
                        ),
                      },
                    ]
                  : []),
                { label: "Items", value: String(s.lineCount) },
                {
                  label: "Total",
                  value: (
                    <span className="font-semibold tabular-nums text-foreground">
                      {formatMoney(s.grandTotal)}
                    </span>
                  ),
                },
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
        ariaLabel={title ?? "Invoices"}
        density="compact"
        className={cn(
          "min-w-0 border-0 shadow-none [&_table]:min-w-[58rem]",
          isInvoicesLayout && "[&_thead]:bg-[var(--color-surface-muted)]/60",
        )}
      >
        {sales.map((s) => (
          <tr
            key={s.id}
            className={cn(
              "border-t border-[var(--color-border)] transition-colors",
              isInvoicesLayout && "hover:bg-[var(--color-cream-50)]/50",
            )}
          >
            <td
              className={cn(
                "px-4 py-3.5 whitespace-nowrap font-mono text-sm font-semibold text-foreground",
                tableCenterCellClass,
              )}
            >
              {s.receiptNo}
            </td>
            <td className="px-4 py-3.5 text-sm text-muted whitespace-nowrap">
              {formatDateTime(s.saleAt)}
            </td>
            <td className={cn("px-4 py-3.5", tableCenterCellClass)}>
              {isInvoicesLayout ? serviceBadge(s.serviceType) : (
                <span className="text-sm text-muted">{serviceLabel(s.serviceType)}</span>
              )}
            </td>
            <td className={cn("px-4 py-3.5 text-sm text-muted", tableCenterCellClass)}>
              {tableCell(s)}
            </td>
            <td className={cn("px-4 py-3.5", tableCenterCellClass)}>
              {isInvoicesLayout ? paymentBadge(s) : (
                <span className="text-sm text-muted">{billingLabel(s.billingType)}</span>
              )}
            </td>
            <td
              className={cn(
                "px-4 py-3.5 text-sm font-mono tabular-nums",
                tableCenterCellClass,
                Number(s.remainingAmount) > 0.005 && "font-medium tone-warning-text",
              )}
            >
              {Number(s.remainingAmount) > 0.005 ? formatMoney(s.remainingAmount!) : "—"}
            </td>
            <td className={cn("px-4 py-3.5 text-sm text-muted", tableCenterCellClass)}>
              {s.lineCount}
            </td>
            <td
              className={cn(
                "px-4 py-3.5 text-sm font-semibold tabular-nums text-foreground",
                tableCenterCellClass,
              )}
            >
              {formatMoney(s.grandTotal)}
            </td>
            <td className="px-4 py-3.5">
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
  );

  if (isInvoicesLayout) {
    return (
      <div className="space-y-5">
        <Card density="compact" className="space-y-0 overflow-hidden p-0">
          <div className="border-b border-[var(--color-border)] px-4 py-3.5 sm:px-5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                <FileText size={16} strokeWidth={1.75} aria-hidden />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Sales period</p>
                <p className="text-xs text-muted">Filter invoices by when the sale was completed.</p>
              </div>
            </div>
          </div>
          <div className="p-4 sm:p-5">{periodFilterBlock}</div>
        </Card>

        <InvoicesSummaryStrip
          totalRecords={meta.total}
          pageRevenue={pageRevenue}
          pageChangeReturned={pageChangeReturned}
          openBalanceCount={openBalanceCount}
          periodParams={periodParams}
          loading={loading}
        />

        <div className="space-y-1">
          <div className="flex items-baseline justify-between gap-3 px-0.5">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Invoice ledger</h2>
              <p className="text-xs text-muted">
                Search, filter, and export completed POS receipts for your records.
              </p>
            </div>
          </div>
          {listSection}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        {title ? (
          <div>
            <h2 className="text-sm font-semibold text-foreground">{title}</h2>
            {description ? <p className="text-xs text-muted">{description}</p> : null}
          </div>
        ) : null}
        <div className={cn("hidden flex-col gap-2 md:flex", !title && "ml-auto")}>
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

      {periodFilterBlock}
      {listSection}
    </div>
  );
}

export function PosRecentSales({
  onView,
  onPrint,
  queryKey,
  variant = "default",
  title,
  description,
  emptyTitle,
  emptyDescription,
}: {
  onView: (id: string) => void;
  onPrint: (id: string) => void;
  queryKey?: string;
  variant?: "default" | "invoices";
  title?: string;
  description?: string;
  emptyTitle?: string;
  emptyDescription?: string;
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
      <PosRecentSalesContent
        onView={onView}
        onPrint={onPrint}
        queryKey={queryKey}
        variant={variant}
        title={title}
        description={description}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
      />
    </Suspense>
  );
}

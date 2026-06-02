"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { HandCoins } from "lucide-react";
import { ListCard, ListCardStack } from "@/src/components/shared/list-card";
import { PageHeader } from "@/src/components/shared/page-header";
import { PaginatedListSection } from "@/src/components/shared/paginated-list-section";
import { TableSkeleton } from "@/src/components/skeletons/table-skeleton";
import { Badge } from "@/src/components/ui/badge";
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
import {
  saleBillStatusLabel,
  salePaymentStatusLabel,
} from "@/src/lib/ar-display";
import { cn } from "@/src/lib/cn";
import { formatDateOnly, formatMoney } from "@/src/lib/format-display";
import { operationsApi } from "@/src/services/operations-api";

type ReceivableRow = {
  id: string;
  receiptNo: string;
  saleAt: string;
  customerName?: string | null;
  customerPhone?: string | null;
  grandTotal: string;
  paidAmount: string;
  remainingAmount: string;
  paymentStatus: "PAID" | "PARTIAL" | "UNPAID";
  billStatus: "OPEN" | "OVERDUE" | "CLOSED";
  dueDate?: string | null;
  lineCount: number;
};

function ReceivablesContent() {
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
    clearFilters,
  } = usePaginatedList<ReceivableRow>({
    queryKey: "customer-receivables",
    fetchFn: (p) =>
      operationsApi.customerReceivables.list({
        page: p.page,
        limit: p.limit,
        search: p.search,
      }),
    defaultSort: { sortBy: "saleAt", sortOrder: "desc" },
    errorMessage: "Failed to load receivables",
    searchPlaceholder: "Search receipt, customer, phone…",
  });

  useEffect(() => {
    void operationsApi.customerReceivables.agingSummary().then(setAging).catch(() => {});
  }, []);

  return (
    <>
      <PageHeader
        title="Customer receivables"
        description="Outstanding customer credit from POS sales. Record payments to settle balances."
      />

      {aging ? (
        <Card className="p-4">
          <p className="text-sm font-medium text-foreground">Total outstanding</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-[var(--color-primary)]">
            {formatMoney(aging.totals.totalOutstanding)}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted sm:grid-cols-5">
            <div>Current: {formatMoney(aging.totals.current)}</div>
            <div>1–30d: {formatMoney(aging.totals.days1_30)}</div>
            <div>31–60d: {formatMoney(aging.totals.days31_60)}</div>
            <div>61–90d: {formatMoney(aging.totals.days61_90)}</div>
            <div>90+d: {formatMoney(aging.totals.days90Plus)}</div>
          </div>
        </Card>
      ) : null}

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
        emptyTitle="No open receivables"
        emptyDescription="Sales with a credit balance will appear here."
        emptyIcon={HandCoins}
        onClearFilters={clearFilters}
        currentPage={meta.page}
        totalPages={meta.totalPages}
        totalRecords={meta.total}
        pageSize={meta.limit}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        mobileCards={
          <ListCardStack>
            {items.map((row) => (
              <ListCard
                key={row.id}
                title={row.receiptNo}
                subtitle={row.customerName ?? row.customerPhone ?? "Walk-in"}
                fields={[
                  { label: "Due", value: formatMoney(row.remainingAmount) },
                  { label: "Due date", value: row.dueDate ? formatDateOnly(row.dueDate) : "—" },
                  { label: "Status", value: salePaymentStatusLabel(row.paymentStatus) },
                ]}
                actions={
                  <Link href={`/customer-receivables/${row.id}`}>
                    <Button size="sm" variant="secondary">
                      View
                    </Button>
                  </Link>
                }
              />
            ))}
          </ListCardStack>
        }
      >
        <ResponsiveTable
          headers={[
            "Receipt",
            "Customer",
            { label: "Sale date", thClassName: tableCenterColumnClass },
            { label: "Due date", thClassName: tableCenterColumnClass },
            { label: "Outstanding", thClassName: tableCenterColumnClass },
            { label: "Status", thClassName: tableCenterColumnClass },
            { label: "Actions", thClassName: tableActionsColumnClass },
          ]}
          ariaLabel="Customer receivables"
        >
          {items.map((row) => (
            <tr key={row.id} className="border-t border-[var(--color-border)]">
              <td className="px-4 py-3 font-mono text-sm font-medium">{row.receiptNo}</td>
              <td className="px-4 py-3 text-sm">
                <p>{row.customerName ?? "—"}</p>
                {row.customerPhone ? (
                  <p className="text-xs text-muted">{row.customerPhone}</p>
                ) : null}
              </td>
              <td className={cn("px-4 py-3 text-sm text-muted", tableCenterCellClass)}>
                {formatDateOnly(row.saleAt)}
              </td>
              <td className={cn("px-4 py-3 text-sm text-muted", tableCenterCellClass)}>
                {row.dueDate ? formatDateOnly(row.dueDate) : "—"}
              </td>
              <td className={cn("px-4 py-3 font-mono text-sm font-semibold tabular-nums", tableCenterCellClass)}>
                {formatMoney(row.remainingAmount)}
              </td>
              <td className={cn("px-4 py-3", tableCenterCellClass)}>
                <Badge variant={row.billStatus === "OVERDUE" ? "danger" : "warning"}>
                  {saleBillStatusLabel(row.billStatus)}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <div className={tableActionsCellClass}>
                  <Link href={`/customer-receivables/${row.id}`}>
                    <Button size="sm" variant="secondary">
                      View
                    </Button>
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

export default function CustomerReceivablesPage() {
  return (
    <section className="page-shell page-content space-y-4">
      <Suspense fallback={<TableSkeleton columns={8} />}>
        <ReceivablesContent />
      </Suspense>
    </section>
  );
}

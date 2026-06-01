"use client";

import type { ReactNode } from "react";
import { CardListSkeleton } from "@/src/components/skeletons/card-list-skeleton";
import { PaginationSkeleton } from "@/src/components/skeletons/pagination-skeleton";
import { TableSkeleton } from "@/src/components/skeletons/table-skeleton";
import { EmptyState } from "@/src/components/ui/empty-state";
import { Pagination } from "@/src/components/ui/pagination";
import { ListPageToolbar } from "@/src/components/shared/list-page-toolbar";
import type { PageSizeOption } from "@/src/lib/pagination-storage";
import { cn } from "@/src/lib/cn";
import type { LucideIcon } from "lucide-react";

type PaginatedListSectionProps = {
  loading: boolean;
  isFetching?: boolean;
  itemsCount: number;
  hasActiveFilters?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  isSearching?: boolean;
  searchResultSummary?: string | null;
  onSearchClear?: () => void;
  filters?: ReactNode;
  mobileSort?: ReactNode;
  toolbar?: ReactNode;
  tableColumns?: number;
  skeletonRows?: number;
  emptyTitle: string;
  emptyDescription: string;
  emptyIcon?: LucideIcon;
  emptyAction?: { label: string; onClick: () => void };
  onClearFilters?: () => void;
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: PageSizeOption) => void;
  children: ReactNode;
  mobileCards?: ReactNode;
  className?: string;
};

export function PaginatedListSection({
  loading,
  isFetching = false,
  itemsCount,
  hasActiveFilters = false,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  isSearching = false,
  searchResultSummary,
  onSearchClear,
  filters,
  mobileSort,
  toolbar,
  tableColumns = 4,
  skeletonRows = 5,
  emptyTitle,
  emptyDescription,
  emptyIcon,
  emptyAction,
  onClearFilters,
  currentPage,
  totalPages,
  totalRecords,
  pageSize,
  onPageChange,
  onPageSizeChange,
  children,
  mobileCards,
  className,
}: PaginatedListSectionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {toolbar ?? (
        <ListPageToolbar
          searchValue={searchValue}
          onSearchChange={onSearchChange}
          onSearchClear={onSearchClear}
          searchPlaceholder={searchPlaceholder}
          isSearching={isSearching}
          resultSummary={!loading ? searchResultSummary : null}
          filters={filters}
          mobileSort={mobileSort}
        />
      )}

      {loading ? (
        <>
          <CardListSkeleton rows={skeletonRows} />
          <TableSkeleton rows={skeletonRows} columns={tableColumns} className="hidden md:block" />
          <PaginationSkeleton />
        </>
      ) : null}

      {!loading && itemsCount === 0 ? (
        <EmptyState
          variant={hasActiveFilters ? "no-results" : "empty"}
          title={hasActiveFilters ? "No results found" : emptyTitle}
          description={
            hasActiveFilters
              ? "Try adjusting your search or filters to find what you need."
              : emptyDescription
          }
          icon={emptyIcon}
          action={
            hasActiveFilters && onClearFilters
              ? { label: "Clear filters", onClick: onClearFilters }
              : emptyAction
          }
        />
      ) : null}

      {!loading && itemsCount > 0 ? (
        <div className="space-y-4">
          {mobileCards}
          <div className="surface-card overflow-hidden p-0 [&_.surface-card]:rounded-none [&_.surface-card]:border-0 [&_.surface-card]:shadow-none">
            <div className={cn(mobileCards && "hidden md:block")}>{children}</div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalRecords={totalRecords}
              pageSize={pageSize}
              onPageChange={onPageChange}
              onPageSizeChange={onPageSizeChange}
              loading={isFetching}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

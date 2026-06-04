"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo } from "react";
import { Button } from "./button";
import { Select } from "./select";
import { cn } from "@/src/lib/cn";
import { formatRecordRange } from "@/src/lib/pagination-display";
import { getPageRange } from "@/src/lib/pagination-range";
import { PAGE_SIZE_OPTIONS, type PageSizeOption } from "@/src/lib/pagination-storage";
import { PaginationSkeleton } from "@/src/components/skeletons/pagination-skeleton";

/** Shared sizing for all pagination toolbar controls. */
const controlClass =
  "!min-h-9 h-9 shrink-0 rounded-md px-3 text-sm font-medium";

const pageButtonClass = cn(
  controlClass,
  "inline-flex min-w-9 items-center justify-center px-2 transition-colors",
);

export function Pagination({
  currentPage,
  totalPages,
  totalRecords,
  pageSize,
  onPageChange,
  onPageSizeChange,
  loading = false,
}: {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: PageSizeOption) => void;
  loading?: boolean;
}) {
  const pageRange = useMemo(() => getPageRange(currentPage, totalPages), [currentPage, totalPages]);
  const recordLabel = formatRecordRange(currentPage, pageSize, totalRecords);

  if (loading && totalRecords === 0) {
    return <PaginationSkeleton />;
  }

  return (
    <nav
      aria-label="Pagination"
      className="border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 sm:px-6 sm:py-3.5"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-6">
        <p className="shrink-0 text-sm text-[var(--color-muted)]" aria-live="polite">
          {recordLabel}
        </p>

        {/* Desktop / tablet controls */}
        <div className="hidden flex-wrap items-center justify-end gap-3 sm:gap-4 md:flex">
          <label className="flex items-center gap-2.5">
            <span className="whitespace-nowrap text-sm text-[var(--color-muted)]">Rows per page</span>
            <Select
              searchable={false}
              appearance="button"
              fullWidth={false}
              size="sm"
              value={String(pageSize)}
              onChange={(event) => onPageSizeChange(Number(event.target.value) as PageSizeOption)}
              className={cn(controlClass, "w-[4.5rem] justify-between gap-1 px-2.5")}
              aria-label="Rows per page"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </Select>
          </label>

          <div className="hidden h-6 w-px shrink-0 bg-[var(--color-border)] sm:block" aria-hidden />

          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className={cn(controlClass, "gap-1.5")}
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1 || loading}
              aria-label="Previous page"
            >
              <ChevronLeft size={16} aria-hidden />
              <span className="hidden lg:inline">Previous</span>
            </Button>

            {totalPages > 1 ? (
              <div className="flex items-center gap-1">
                {pageRange.map((item, index) =>
                  item === "ellipsis" ? (
                    <span
                      key={`ellipsis-${index}`}
                      className="px-1.5 text-sm text-[var(--color-muted)]"
                      aria-hidden
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      onClick={() => onPageChange(item)}
                      disabled={loading}
                      aria-label={`Page ${item}`}
                      aria-current={item === currentPage ? "page" : undefined}
                      className={cn(
                        pageButtonClass,
                        item === currentPage
                          ? "border border-transparent bg-[var(--color-primary)] text-white shadow-[var(--shadow-sm)]"
                          : "border border-transparent text-[var(--color-foreground)] hover:border-[var(--color-border)] hover:bg-[var(--color-cream-100)]",
                      )}
                    >
                      {item}
                    </button>
                  ),
                )}
              </div>
            ) : null}

            <Button
              type="button"
              variant="secondary"
              size="sm"
              className={cn(controlClass, "gap-1.5")}
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || totalPages === 0 || loading}
              aria-label="Next page"
            >
              <span className="hidden lg:inline">Next</span>
              <ChevronRight size={16} aria-hidden />
            </Button>
          </div>
        </div>

        {/* Mobile prev / next */}
        <div className="flex items-center justify-between gap-3 md:hidden">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className={cn(controlClass, "gap-1.5")}
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1 || loading}
            aria-label="Previous page"
          >
            <ChevronLeft size={16} aria-hidden />
            Previous
          </Button>
          <span className="text-sm tabular-nums text-[var(--color-muted)]">
            Page {Math.max(currentPage, 1)} of {Math.max(totalPages, 1)}
          </span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className={cn(controlClass, "gap-1.5")}
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages || totalPages === 0 || loading}
            aria-label="Next page"
          >
            Next
            <ChevronRight size={16} aria-hidden />
          </Button>
        </div>
      </div>

      {/* Rows per page — tablet only; hidden on narrow phones */}
      <div className="mt-3 hidden items-center justify-between gap-3 border-t border-[var(--color-border)] pt-3 sm:flex md:hidden">
        <span className="text-sm text-[var(--color-muted)]">Rows per page</span>
        <Select
          searchable={false}
          appearance="button"
          fullWidth={false}
          size="sm"
          value={String(pageSize)}
          onChange={(event) => onPageSizeChange(Number(event.target.value) as PageSizeOption)}
          className={cn(controlClass, "w-[4.5rem] justify-between gap-1 px-2.5")}
          aria-label="Rows per page"
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </Select>
      </div>
    </nav>
  );
}

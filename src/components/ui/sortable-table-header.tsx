"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "@/src/lib/cn";
import type { SortOrder } from "@/src/lib/pagination-url";

export function SortableTableHeader({
  label,
  sortKey,
  currentSortBy,
  currentSortOrder,
  onSort,
  className,
  align = "left",
}: {
  label: string;
  sortKey: string;
  currentSortBy?: string;
  currentSortOrder?: SortOrder;
  onSort: (sortKey: string) => void;
  className?: string;
  align?: "left" | "right" | "center";
}) {
  const isActive = currentSortBy === sortKey;
  const ariaSort =
    isActive && currentSortOrder === "asc"
      ? "ascending"
      : isActive && currentSortOrder === "desc"
        ? "descending"
        : "none";

  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      aria-sort={ariaSort}
      className={cn(
        "inline-flex items-center gap-1 font-medium transition-colors hover:text-[var(--color-foreground)]",
        align === "right" && "ml-auto",
        align === "center" && "mx-auto",
        isActive ? "text-[var(--color-foreground)]" : "text-[var(--color-muted)]",
        className,
      )}
    >
      <span>{label}</span>
      {isActive ? (
        currentSortOrder === "asc" ? (
          <ArrowUp className="h-3.5 w-3.5" aria-hidden />
        ) : (
          <ArrowDown className="h-3.5 w-3.5" aria-hidden />
        )
      ) : (
        <ArrowUpDown className="h-3.5 w-3.5 opacity-50" aria-hidden />
      )}
    </button>
  );
}

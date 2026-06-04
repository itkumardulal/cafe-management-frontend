"use client";

import { Select } from "@/src/components/ui/select";
import { cn } from "@/src/lib/cn";

export type SortOption = {
  label: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
};

export function MobileSortSelect({
  options,
  currentSortBy,
  currentSortOrder,
  onSort,
  className,
}: {
  options: SortOption[];
  currentSortBy?: string;
  currentSortOrder?: "asc" | "desc";
  onSort: (sortBy: string, sortOrder: "asc" | "desc") => void;
  className?: string;
}) {
  const currentValue =
    options.find((o) => o.sortBy === currentSortBy && o.sortOrder === currentSortOrder)?.label ??
    options[0]?.label ??
    "";

  return (
    <div className={cn("md:hidden", className)}>
      <label className="mb-1 block text-xs font-medium text-[var(--color-muted)]" htmlFor="mobile-sort">
        Sort by
      </label>
      <Select
        searchable={false}
        id="mobile-sort"
        appearance="field"
        value={currentValue}
        onChange={(event) => {
          const selected = options.find((o) => o.label === event.target.value);
          if (selected) {
            onSort(selected.sortBy, selected.sortOrder);
          }
        }}
        aria-label="Sort list"
      >
        {options.map((option) => (
          <option key={`${option.sortBy}-${option.sortOrder}`} value={option.label}>
            {option.label}
          </option>
        ))}
      </Select>
    </div>
  );
}

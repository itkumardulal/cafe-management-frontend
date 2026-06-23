"use client";

import { Loader2, Search, X } from "lucide-react";
import type { ReactNode } from "react";
import { Input } from "@/src/components/ui/input";
import { cn } from "@/src/lib/cn";

export function ListPageToolbar({
  searchValue,
  onSearchChange,
  onSearchClear,
  searchPlaceholder = "Search…",
  isSearching = false,
  resultSummary,
  filters,
  mobileSort,
  className,
}: {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearchClear?: () => void;
  searchPlaceholder?: string;
  isSearching?: boolean;
  resultSummary?: string | null;
  filters?: ReactNode;
  mobileSort?: ReactNode;
  className?: string;
}) {
  const showSearch = onSearchChange !== undefined;
  const hasQuery = Boolean(searchValue?.trim());

  if (!showSearch && !filters && !mobileSort) {
    return null;
  }

  const handleClear = () => {
    if (onSearchClear) {
      onSearchClear();
      return;
    }
    onSearchChange?.("");
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-row flex-wrap items-center gap-2">
        {showSearch ? (
          <div className="min-w-[12rem] flex-1">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]"
                aria-hidden
              />
              <Input
                type="search"
                enterKeyHint="search"
                value={searchValue ?? ""}
                onChange={(event) => onSearchChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape" && hasQuery) {
                    event.preventDefault();
                    handleClear();
                  }
                }}
                placeholder={searchPlaceholder}
                className={cn("h-10 pl-9", (hasQuery || isSearching) && "pr-16")}
                aria-label={searchPlaceholder}
              />
              <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                {isSearching ? (
                  <Loader2
                    className="h-4 w-4 animate-spin text-[var(--color-muted)]"
                    aria-hidden
                  />
                ) : null}
                {hasQuery ? (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="icon-button-square text-[var(--color-muted)] transition-colors hover:bg-[var(--color-cream-100)] hover:text-[var(--color-foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                ) : null}
              </div>
            </div>
            {resultSummary ? (
              <p className="mt-1.5 text-xs text-[var(--color-muted)] sm:text-right" aria-live="polite">
                {resultSummary}
              </p>
            ) : null}
          </div>
        ) : null}

        {filters || mobileSort ? (
          <div className="flex shrink-0 flex-nowrap items-center gap-2">
            {filters}
            {mobileSort ? <div className="shrink-0">{mobileSort}</div> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

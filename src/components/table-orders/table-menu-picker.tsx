"use client";

import { Search, X } from "lucide-react";
import { useMemo, useRef } from "react";
import { tableOrdersScrollArea } from "@/src/components/table-orders/table-orders-layout";
import { MenuSectionSlider } from "@/src/components/table-orders/menu-section-slider";
import { MenuSearchResults } from "@/src/components/table-orders/menu-search-results";
import { Input } from "@/src/components/ui/input";
import { cn } from "@/src/lib/cn";
import {
  buildCatalogSections,
  buildCategoryChips,
  filterCatalogBySearch,
  SPECIALS_FILTER_ID,
} from "@/src/lib/menu-catalog-layout";
import type { SellableCatalogData, SellableCatalogItem } from "@/src/store/types/reference-data.types";

const categoryChipClass = (active: boolean) =>
  cn(
    "shrink-0 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
    active
      ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-nav-active-text)] shadow-sm"
      : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-nav-idle)] hover:border-[var(--color-input)] hover:bg-[var(--color-cream-100)] hover:text-[var(--color-nav-idle-hover)]",
  );

export type MenuCatalogItem = SellableCatalogItem;

type TableMenuPickerProps = {
  catalog: SellableCatalogData;
  loading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  qtyByItemId: Map<string, number>;
  disabled?: boolean;
  onAddItem: (item: MenuCatalogItem) => void;
};

export function TableMenuPicker({
  catalog,
  loading,
  search,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  qtyByItemId,
  disabled,
  onAddItem,
}: TableMenuPickerProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const items = catalog.items;
  const isSearching = search.trim().length > 0;

  const categoryChips = useMemo(
    () => buildCategoryChips(catalog.categories, items),
    [catalog.categories, items],
  );

  const searchResults = useMemo(
    () => (isSearching ? filterCatalogBySearch(items, search) : []),
    [items, search, isSearching],
  );

  const sections = useMemo(
    () =>
      isSearching
        ? []
        : buildCatalogSections(catalog.categories, items, { categoryFilter }),
    [catalog.categories, items, categoryFilter, isSearching],
  );

  const clearSearch = () => {
    onSearchChange("");
    searchInputRef.current?.focus();
  };

  return (
    <div className="flex h-full min-h-0 flex-1 basis-0 flex-col overflow-hidden">
      <div className="shrink-0 min-w-0 space-y-2.5 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
        <div className="relative min-w-0">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]"
            aria-hidden
          />
          <Input
            ref={searchInputRef}
            type="text"
            role="searchbox"
            enterKeyHint="search"
            autoComplete="off"
            className={cn(
              "search-field-custom-clear h-10 border-[var(--color-border)] bg-[var(--color-surface)] pl-9 text-[var(--color-foreground)]",
              isSearching && "pr-10",
            )}
            placeholder="Search dishes to add quickly…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape" && isSearching) {
                e.preventDefault();
                clearSearch();
              }
            }}
            disabled={disabled}
            aria-label="Search dishes"
          />
          {isSearching ? (
            <button
              type="button"
              onPointerDown={(event) => {
                event.preventDefault();
                clearSearch();
              }}
              disabled={disabled}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-[var(--color-muted)] transition-colors hover:bg-[var(--color-cream-100)] hover:text-[var(--color-foreground)]"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          ) : null}
        </div>

        {!isSearching && categoryChips.length > 0 ? (
          <div className="flex min-w-0 flex-wrap gap-1">
            <button
              type="button"
              onClick={() => onCategoryFilterChange("")}
              className={categoryChipClass(!categoryFilter)}
            >
              All
            </button>
            {categoryChips.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onCategoryFilterChange(c.id)}
                className={categoryChipClass(categoryFilter === c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className={cn(tableOrdersScrollArea, "bg-[var(--color-surface)] p-4")}>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: isSearching ? 4 : 3 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "animate-pulse rounded-xl bg-[var(--color-cream-100)]",
                  isSearching ? "h-16" : "h-36",
                )}
              />
            ))}
          </div>
        ) : isSearching ? (
          <div className="space-y-3">
            <p className="text-xs font-medium text-[var(--color-muted)]" aria-live="polite">
              {searchResults.length === 0
                ? "No matches — try another name or clear search to browse."
                : `${searchResults.length} match${searchResults.length === 1 ? "" : "es"} — tap Add to put on the ticket`}
            </p>
            <MenuSearchResults
              items={searchResults}
              qtyByItemId={qtyByItemId}
              disabled={disabled}
              onAddItem={onAddItem}
            />
          </div>
        ) : sections.length === 0 ? (
          <p className="py-8 text-center text-sm font-medium text-[var(--color-muted)]">
            No dishes in this category.
          </p>
        ) : (
          <div className="space-y-3">
            {sections.map((section) => (
              <MenuSectionSlider
                key={section.id}
                title={section.title}
                items={section.items}
                qtyByItemId={qtyByItemId}
                disabled={disabled}
                onAddItem={onAddItem}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export { SPECIALS_FILTER_ID };

"use client";

import { Search, UtensilsCrossed } from "lucide-react";
import { useMemo } from "react";
import { tableOrdersScrollArea } from "@/src/components/table-orders/table-orders-layout";
import { MenuSectionSlider } from "@/src/components/table-orders/menu-section-slider";
import { Input } from "@/src/components/ui/input";
import { cn } from "@/src/lib/cn";
import {
  buildCatalogSections,
  buildCategoryChips,
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
  const items = catalog.items;
  const categoryChips = useMemo(
    () => buildCategoryChips(catalog.categories, items),
    [catalog.categories, items],
  );

  const sections = useMemo(
    () =>
      buildCatalogSections(catalog.categories, items, {
        categoryFilter,
        search,
      }),
    [catalog.categories, items, categoryFilter, search],
  );

  const filteredCount = useMemo(() => {
    if (search.trim() || categoryFilter) {
      return sections.reduce((n, s) => n + s.items.length, 0);
    }
    return items.length;
  }, [sections, items.length, search, categoryFilter]);

  return (
    <div className="flex h-full min-h-0 flex-1 basis-0 flex-col overflow-hidden">
      <div className="shrink-0 min-w-0 space-y-2.5 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-surface)] text-[var(--color-primary)] shadow-[var(--shadow-sm)]">
            <UtensilsCrossed className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--color-foreground)]">Menu</p>
            <p className="truncate text-xs text-[var(--color-muted)]">
              {loading ? "Loading dishes…" : `${filteredCount} available · use Add on each dish`}
            </p>
          </div>
        </div>
        <div className="relative min-w-0">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]"
            aria-hidden
          />
          <Input
            className="h-10 border-[var(--color-border)] bg-[var(--color-surface)] pl-9 text-[var(--color-foreground)]"
            placeholder="Search dishes…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            disabled={disabled}
          />
        </div>
        {categoryChips.length > 0 ? (
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

      <div className={cn(tableOrdersScrollArea, "space-y-3 bg-[var(--color-surface)] p-4")}>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-36 animate-pulse rounded-xl bg-[var(--color-cream-100)]" />
            ))}
          </div>
        ) : sections.length === 0 ? (
          <p className="py-8 text-center text-sm font-medium text-[var(--color-muted)]">
            No menu items match your search.
          </p>
        ) : (
          sections.map((section) => (
            <MenuSectionSlider
              key={section.id}
              title={section.title}
              items={section.items}
              qtyByItemId={qtyByItemId}
              disabled={disabled}
              onAddItem={onAddItem}
            />
          ))
        )}
      </div>
    </div>
  );
}

export { SPECIALS_FILTER_ID };

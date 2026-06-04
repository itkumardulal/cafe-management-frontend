"use client";

import { Search, UtensilsCrossed } from "lucide-react";
import { useMemo } from "react";
import { tableOrdersScrollArea } from "@/src/components/table-orders/table-orders-layout";
import { MenuSectionSlider } from "@/src/components/table-orders/menu-section-slider";
import { Input } from "@/src/components/ui/input";
import { cn } from "@/src/lib/cn";

export type MenuCatalogItem = {
  id: string;
  name: string;
  categoryName: string;
  imageUrl?: string | null;
  trackStock: boolean;
  quantityOnHand: string | null;
  sellPricePerUnit: string;
};

type TableMenuPickerProps = {
  catalog: MenuCatalogItem[];
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
  const categories = useMemo(() => {
    const set = new Set(catalog.map((c) => c.categoryName));
    return [...set].sort();
  }, [catalog]);

  const filtered = useMemo(() => {
    let items = catalog;
    if (categoryFilter) items = items.filter((c) => c.categoryName === categoryFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter((c) => c.name.toLowerCase().includes(q));
    }
    return items;
  }, [catalog, categoryFilter, search]);

  const showGrouped = !categoryFilter && !search.trim();

  const sections = useMemo(() => {
    if (!showGrouped) return [["All items", filtered] as const];
    const map = new Map<string, MenuCatalogItem[]>();
    for (const item of filtered) {
      const list = map.get(item.categoryName) ?? [];
      list.push(item);
      map.set(item.categoryName, list);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered, showGrouped]);

  return (
    <div className="flex h-full min-h-0 flex-1 basis-0 flex-col overflow-hidden">
      <div className="shrink-0 space-y-2.5 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-surface)] text-[var(--color-primary)] shadow-[var(--shadow-sm)]">
            <UtensilsCrossed className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold text-[var(--color-foreground)]">Menu</p>
            <p className="text-xs text-[var(--color-muted)]">
              {loading ? "Loading dishes…" : `${filtered.length} available · tap to add`}
            </p>
          </div>
        </div>
        <div className="relative">
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
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none]">
          <CategoryChip
            active={!categoryFilter}
            onClick={() => onCategoryFilterChange("")}
            label="All"
          />
          {categories.map((c) => (
            <CategoryChip
              key={c}
              active={categoryFilter === c}
              onClick={() => onCategoryFilterChange(c)}
              label={c}
            />
          ))}
        </div>
      </div>

      <div className={cn(tableOrdersScrollArea, "space-y-3 bg-[var(--color-surface)] p-4")}>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-36 animate-pulse rounded-xl bg-[var(--color-cream-100)]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-sm font-medium text-[var(--color-muted)]">
            No menu items match your search.
          </p>
        ) : (
          sections.map(([category, items]) => (
            <MenuSectionSlider
              key={category}
              title={category}
              items={items}
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

function CategoryChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-200",
        active
          ? "border-transparent bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-[var(--shadow-sm)]"
          : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] hover:border-[color-mix(in_srgb,var(--color-primary)_25%,var(--color-border))] hover:bg-[color-mix(in_srgb,var(--color-primary)_6%,var(--color-surface))] hover:text-[var(--color-foreground)]",
      )}
    >
      {label}
    </button>
  );
}

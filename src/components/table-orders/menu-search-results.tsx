"use client";

import { UtensilsCrossed } from "lucide-react";
import { cn } from "@/src/lib/cn";
import { formatMoney } from "@/src/lib/format-display";
import type { MenuCatalogItem } from "./table-menu-picker";

type MenuSearchResultsProps = {
  items: MenuCatalogItem[];
  qtyByItemId: Map<string, number>;
  disabled?: boolean;
  onAddItem: (item: MenuCatalogItem) => void;
};

export function MenuSearchResults({
  items,
  qtyByItemId,
  disabled,
  onAddItem,
}: MenuSearchResultsProps) {
  if (items.length === 0) {
    return (
      <p className="py-6 text-center text-sm font-medium text-[var(--color-muted)]">
        No dishes match — try another name or clear search to browse.
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {items.map((item) => (
        <MenuSearchResultCard
          key={item.id}
          item={item}
          qty={qtyByItemId.get(item.id) ?? 0}
          disabled={disabled}
          onAdd={() => onAddItem(item)}
        />
      ))}
    </ul>
  );
}

function MenuSearchResultCard({
  item,
  qty,
  disabled,
  onAdd,
}: {
  item: MenuCatalogItem;
  qty: number;
  disabled?: boolean;
  onAdd: () => void;
}) {
  const stock = item.trackStock ? Number(item.quantityOnHand ?? 0) : null;
  const outOfStock =
    item.trackStock && (!Number.isFinite(stock!) || (stock ?? 0) <= 0);
  const inOrder = qty > 0;

  return (
    <li>
      <article
        className={cn(
          "flex items-center gap-2.5 rounded-lg border bg-[var(--color-surface)] p-2 text-left transition-colors",
          outOfStock && "opacity-50",
          inOrder
            ? "border-[var(--color-primary)] bg-[color-mix(in_srgb,var(--color-primary)_5%,var(--color-surface))] ring-1 ring-[color-mix(in_srgb,var(--color-primary)_18%,transparent)]"
            : "border-[var(--color-border)] hover:border-[var(--color-input)]",
        )}
      >
        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md bg-[var(--color-cream-100)]">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-[var(--color-muted)]">
              <UtensilsCrossed className="h-5 w-5 opacity-40" strokeWidth={1.25} aria-hidden />
            </div>
          )}
          {inOrder ? (
            <span className="absolute right-0.5 top-0.5 rounded bg-[var(--color-primary)] px-1 py-px text-[9px] font-semibold tabular-nums text-[var(--color-primary-foreground)]">
              ×{qty % 1 === 0 ? qty : qty.toFixed(1)}
            </span>
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-xs font-semibold leading-tight text-[var(--color-foreground)]">
            {item.name}
          </p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <p className="font-mono text-xs font-semibold tabular-nums text-[var(--color-primary)] dark:text-[var(--color-primary-hover)]">
              {formatMoney(item.sellPricePerUnit)}
            </p>
            {item.trackStock ? (
              <p className="text-[10px] font-medium text-[var(--color-muted)]">
                {outOfStock ? "Out of stock" : `${item.quantityOnHand} left`}
              </p>
            ) : null}
          </div>
        </div>

        <button
          type="button"
          disabled={disabled || outOfStock}
          onClick={onAdd}
          aria-label={`Add ${item.name}`}
          className={cn(
            "shrink-0 rounded border px-2.5 py-1.5 text-[11px] font-semibold transition-colors",
            disabled || outOfStock
              ? "cursor-not-allowed border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-muted)] opacity-50"
              : "border-transparent bg-[var(--color-danger)] text-white hover:bg-[color-mix(in_srgb,var(--color-danger)_88%,#000)]",
          )}
        >
          Add
        </button>
      </article>
    </li>
  );
}

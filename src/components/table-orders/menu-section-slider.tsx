"use client";

import { ChevronLeft, ChevronRight, UtensilsCrossed } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/src/lib/cn";
import { formatMoney } from "@/src/lib/format-display";
import type { MenuCatalogItem } from "./table-menu-picker";

type MenuSectionSliderProps = {
  title: string;
  items: MenuCatalogItem[];
  qtyByItemId: Map<string, number>;
  disabled?: boolean;
  onAddItem: (item: MenuCatalogItem) => void;
};

export function MenuSectionSlider({
  title,
  items,
  qtyByItemId,
  disabled,
  onAddItem,
}: MenuSectionSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollHints = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  const scrollBy = (dir: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    const amount = Math.max(200, el.clientWidth * 0.75) * dir;
    el.scrollBy({ left: amount, behavior: "smooth" });
  };

  useEffect(() => {
    updateScrollHints();
    const el = trackRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => updateScrollHints());
    ro.observe(el);
    return () => ro.disconnect();
  }, [items.length, updateScrollHints]);

  if (items.length === 0) return null;

  return (
    <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="flex items-center justify-between gap-2 border-b border-[var(--color-border)] px-2.5 py-1.5">
        <h3 className="text-[11px] font-semibold text-[var(--color-foreground)]">{title}</h3>
        <span className="text-[10px] text-[var(--color-muted)]">
          {items.length} · swipe
        </span>
      </div>

      <div className="relative">
        {canScrollLeft ? (
          <ScrollButton side="left" onClick={() => scrollBy(-1)} />
        ) : null}
        {canScrollRight ? (
          <ScrollButton side="right" onClick={() => scrollBy(1)} />
        ) : null}

        <div
          ref={trackRef}
          onScroll={updateScrollHints}
          className={cn(
            "flex gap-2 overflow-x-auto overscroll-x-contain px-2.5 py-2.5",
            "snap-x snap-mandatory scroll-smooth [scrollbar-width:thin]",
            "[&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[var(--color-input)]",
          )}
        >
          {items.map((item) => (
            <MenuSlideTile
              key={item.id}
              item={item}
              qty={qtyByItemId.get(item.id) ?? 0}
              disabled={disabled}
              onAdd={() => onAddItem(item)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function ScrollButton({
  side,
  onClick,
}: {
  side: "left" | "right";
  onClick: () => void;
}) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Scroll dishes left" : "Scroll dishes right"}
      className={cn(
        "absolute top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full",
        "border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-md)]",
        "text-[var(--color-foreground)] hover:bg-[var(--color-cream-100)]",
        side === "left" ? "left-1" : "right-1",
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function MenuSlideTile({
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
    <article
      className={cn(
        "flex w-[10.5rem] shrink-0 snap-start items-center gap-2 overflow-hidden rounded-lg border p-2 text-left sm:w-[11rem]",
        "bg-[var(--color-surface)]",
        outOfStock && "opacity-50",
        inOrder
          ? "border-[var(--color-primary)] bg-[color-mix(in_srgb,var(--color-primary)_5%,var(--color-surface))] ring-1 ring-[color-mix(in_srgb,var(--color-primary)_18%,transparent)]"
          : "border-[var(--color-border)]",
      )}
    >
      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md bg-[var(--color-cream-100)]">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
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
        <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
          <p className="font-mono text-xs font-semibold tabular-nums text-[var(--color-primary)] dark:text-[var(--color-primary-hover)]">
            {formatMoney(item.sellPricePerUnit)}
          </p>
          {item.trackStock ? (
            <p className="text-[10px] font-medium text-[var(--color-muted)]">
              {outOfStock ? "Out" : `${item.quantityOnHand} left`}
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
          "shrink-0 self-center rounded border px-2 py-1 text-[11px] font-semibold transition-colors",
          disabled || outOfStock
            ? "cursor-not-allowed border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-muted)] opacity-50"
            : "border-transparent bg-[var(--color-danger)] text-white hover:bg-[color-mix(in_srgb,var(--color-danger)_88%,#000)]",
        )}
      >
        Add
      </button>
    </article>
  );
}

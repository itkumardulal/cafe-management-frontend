"use client";

import { useEffect, useRef } from "react";
import { X, UtensilsCrossed } from "lucide-react";
import { formatMoney } from "@/src/lib/format-display";
import type { PublicMenuItem } from "@/src/services/public-menu-api";
import { formatMenuItemUnit } from "./public-menu-utils";
import { PublicMenuImage } from "./public-menu-image";

type MenuItemSheetProps = {
  item: PublicMenuItem | null;
  categoryName?: string;
  onClose: () => void;
};

export function MenuItemSheet({ item, categoryName, onClose }: MenuItemSheetProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!item) return;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [item, onClose]);

  if (!item) return null;

  const unitLabel = formatMenuItemUnit(item);

  return (
    <div className="public-menu-sheet-root" role="presentation" onClick={onClose}>
      <div
        className="public-menu-sheet-panel safe-bottom"
        role="dialog"
        aria-modal="true"
        aria-labelledby="public-menu-sheet-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="public-menu-sheet-handle" aria-hidden />
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close item details"
          className="public-menu-sheet-close"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>

        <div className="public-menu-sheet-media">
          {item.imageUrl ? (
            <PublicMenuImage
              src={item.imageUrl}
              alt={item.name}
              sizes="(max-width: 640px) 100vw, 640px"
            />
          ) : (
            <div className="public-menu-item-media-fallback h-full min-h-[12rem]">
              <UtensilsCrossed className="h-12 w-12" strokeWidth={1.25} aria-hidden />
            </div>
          )}
        </div>

        <div className="public-menu-sheet-body">
          {categoryName ? (
            <p className="public-menu-eyebrow mb-2">{categoryName}</p>
          ) : null}
          <h2 id="public-menu-sheet-title" className="public-menu-text text-xl font-bold tracking-tight">
            {item.name}
          </h2>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <p className="public-menu-item-price">{formatMoney(item.sellPricePerUnit)}</p>
            {item.itemType?.trim() ? (
              <span className="public-menu-item-type">{item.itemType.trim()}</span>
            ) : null}
          </div>
          {unitLabel ? (
            <p className="public-menu-item-unit mt-3">
              <span className="public-menu-item-unit-dot" aria-hidden />
              {unitLabel}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

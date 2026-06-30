"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Sparkles, UtensilsCrossed, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { formatMoney } from "@/src/lib/format-display";
import type { PublicMenuItem } from "@/src/services/public-menu-api";
import { resolvePublicMenuAssetUrl } from "@/src/services/public-menu-api";
import { formatMenuItemUnit, getDietaryType } from "./public-menu-utils";
import { PublicMenuImage } from "./public-menu-image";

type MenuItemSheetProps = {
  item: PublicMenuItem | null;
  categoryName?: string;
  onClose: () => void;
};

function subscribeReducedMotion(cb: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function getReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function SheetMedia({ imageUrl, name }: { imageUrl: string | null; name: string }) {
  const [failed, setFailed] = useState(false);
  const resolvedUrl = resolvePublicMenuAssetUrl(imageUrl);
  const showImage = Boolean(resolvedUrl) && !failed;

  if (!showImage) {
    const initial = name.trim().charAt(0).toUpperCase() || "?";
    return (
      <div className="public-menu-sheet-fallback" aria-hidden>
        <span className="public-menu-sheet-fallback-monogram">{initial}</span>
        <UtensilsCrossed className="public-menu-sheet-fallback-icon" strokeWidth={1.25} />
      </div>
    );
  }

  return (
    <PublicMenuImage
      src={resolvedUrl!}
      alt=""
      sizes="(max-width: 640px) 100vw, 640px"
      onError={() => setFailed(true)}
    />
  );
}

export function MenuItemSheet({ item, categoryName, onClose }: MenuItemSheetProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    () => false,
  );

  useEffect(() => {
    if (!item) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [item, onClose]);

  const unitLabel = item ? formatMenuItemUnit(item) : null;
  const dietaryType = item ? getDietaryType(item.itemType) : null;
  const itemTypeLabel = item?.itemType?.trim() || null;
  const showCategory =
    Boolean(categoryName) &&
    Boolean(item) &&
    categoryName!.trim().toLowerCase() !== item!.name.trim().toLowerCase();

  return (
    <AnimatePresence>
      {item ? (
        <motion.div
          key={item.catalogItemId}
          className="public-menu-sheet-root"
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.22 }}
          onClick={onClose}
        >
          <motion.div
            className="public-menu-sheet-panel safe-bottom"
            role="dialog"
            aria-modal="true"
            aria-labelledby="public-menu-sheet-title"
            initial={reducedMotion ? false : { y: "100%" }}
            animate={{ y: 0 }}
            exit={reducedMotion ? undefined : { y: "100%" }}
            transition={reducedMotion ? { duration: 0 } : { type: "spring", damping: 30, stiffness: 320 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="public-menu-sheet-chrome">
              <div className="public-menu-sheet-handle" aria-hidden />
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                aria-label="Close item details"
                className="public-menu-sheet-close"
              >
                <X className="h-5 w-5" strokeWidth={2} aria-hidden />
              </button>
            </div>

            <div className="public-menu-sheet-media">
              <SheetMedia
                key={`${item.catalogItemId}-${item.imageUrl ?? "none"}`}
                imageUrl={item.imageUrl}
                name={item.name}
              />
              <div className="public-menu-sheet-media-overlay" aria-hidden />
            </div>

            <div className="public-menu-sheet-body">
              {showCategory ? <p className="public-menu-eyebrow">{categoryName}</p> : null}

              <div className="public-menu-sheet-title-row">
                <h2 id="public-menu-sheet-title" className="public-menu-sheet-title">
                  {item.name}
                </h2>
                <p className="public-menu-sheet-price">{formatMoney(item.sellPricePerUnit)}</p>
              </div>

              <div className="public-menu-sheet-meta">
                {dietaryType ? (
                  <span
                    className={`public-menu-diet-badge ${dietaryType === "veg" ? "is-veg" : "is-non-veg"}`}
                  >
                    {dietaryType === "veg" ? "Vegetarian" : "Non-veg"}
                  </span>
                ) : null}
                {item.isSpecial ? (
                  <span className="public-menu-item-type">
                    <Sparkles className="h-3.5 w-3.5" aria-hidden />
                    Popular
                  </span>
                ) : null}
                {itemTypeLabel ? (
                  <span className="public-menu-item-variant">{itemTypeLabel}</span>
                ) : null}
              </div>

              {unitLabel ? (
                <p className="public-menu-sheet-serving-note">
                  Served as <strong>{unitLabel}</strong>
                </p>
              ) : (
                <p className="public-menu-sheet-serving-note">
                  Freshly prepared in our kitchen.
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

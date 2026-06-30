"use client";

import { useState } from "react";
import { Dot, Sparkles, UtensilsCrossed } from "lucide-react";
import { motion } from "framer-motion";
import { formatMoney } from "@/src/lib/format-display";
import type { PublicMenuItem } from "@/src/services/public-menu-api";
import { resolvePublicMenuAssetUrl } from "@/src/services/public-menu-api";
import { formatMenuItemUnit, getDietaryType, motionListDelay } from "./public-menu-utils";
import { PublicMenuImage } from "./public-menu-image";

type MenuItemRowProps = {
  item: PublicMenuItem;
  categoryName?: string;
  index?: number;
  reducedMotion?: boolean;
  onSelect?: (item: PublicMenuItem) => void;
};

function ItemMedia({ imageUrl, name }: { imageUrl: string | null; name: string }) {
  const [failed, setFailed] = useState(false);
  const resolvedUrl = resolvePublicMenuAssetUrl(imageUrl);
  const showImage = Boolean(resolvedUrl) && !failed;

  return (
    <div className="public-menu-item-media">
      {showImage ? (
        <PublicMenuImage
          src={resolvedUrl!}
          alt={name}
          sizes="(max-width: 640px) 100vw, 640px"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="public-menu-item-media-fallback">
          <UtensilsCrossed className="h-10 w-10" strokeWidth={1.25} aria-hidden />
        </div>
      )}
    </div>
  );
}

export function MenuItemRow({
  item,
  categoryName,
  index = 0,
  reducedMotion,
  onSelect,
}: MenuItemRowProps) {
  const unitLabel = formatMenuItemUnit(item);
  const interactive = Boolean(onSelect);
  const dietaryType = getDietaryType(item.itemType);
  const itemTypeLabel = item.itemType?.trim() || null;
  const description = unitLabel
    ? `${itemTypeLabel ? `${itemTypeLabel} · ` : ""}${unitLabel}`
    : itemTypeLabel
      ? `${itemTypeLabel} speciality`
      : "Freshly prepared in our kitchen";

  const content = (
    <article
      className={`public-menu-item-card${interactive ? " public-menu-item-card-interactive" : ""}`}
      {...(interactive
        ? {
            role: "button" as const,
            tabIndex: 0,
            onClick: () => onSelect?.(item),
            onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelect?.(item);
              }
            },
          }
        : {})}
    >
      <ItemMedia imageUrl={item.imageUrl} name={item.name} />
      <div className="public-menu-item-body">
        {categoryName ? <p className="public-menu-item-category">{categoryName}</p> : null}
        <div className="public-menu-item-header">
          <h3 className="public-menu-item-name">{item.name}</h3>
          <p className="public-menu-item-price">{formatMoney(item.sellPricePerUnit)}</p>
        </div>
        <p className="public-menu-item-description">{description}</p>
        <div className="flex flex-wrap items-center gap-2.5">
          {dietaryType ? (
            <span className={`public-menu-diet-badge ${dietaryType === "veg" ? "is-veg" : "is-non-veg"}`}>
              <Dot className="h-3.5 w-3.5" aria-hidden />
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
      </div>
    </article>
  );

  if (reducedMotion) return content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.38,
        delay: motionListDelay(index),
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {content}
    </motion.div>
  );
}

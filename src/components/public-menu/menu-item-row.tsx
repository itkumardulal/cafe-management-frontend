"use client";

import { useState } from "react";
import { UtensilsCrossed } from "lucide-react";
import { motion } from "framer-motion";
import { formatMoney } from "@/src/lib/format-display";
import type { PublicMenuItem } from "@/src/services/public-menu-api";
import { formatMenuItemUnit, motionListDelay } from "./public-menu-utils";
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
  const showImage = Boolean(imageUrl) && !failed;

  return (
    <div className="public-menu-item-media">
      {showImage ? (
        <PublicMenuImage
          src={imageUrl!}
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
        <div className="flex flex-wrap items-center gap-2">
          {item.itemType?.trim() ? (
            <span className="public-menu-item-type">{item.itemType.trim()}</span>
          ) : null}
          {unitLabel ? (
            <p className="public-menu-item-unit">
              <span className="public-menu-item-unit-dot" aria-hidden />
              {unitLabel}
            </p>
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

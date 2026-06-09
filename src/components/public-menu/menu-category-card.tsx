"use client";

import { ChevronRight, UtensilsCrossed } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/src/lib/cn";
import type { PublicMenuCategory } from "@/src/services/public-menu-api";
import { categoryCoverImage, motionListDelay } from "./public-menu-utils";
import { PublicMenuImage } from "./public-menu-image";

type MenuCategoryCardProps = {
  category: PublicMenuCategory;
  index?: number;
  reducedMotion?: boolean;
  onSelect: (categoryId: string) => void;
};

export function MenuCategoryCard({
  category,
  index = 0,
  reducedMotion,
  onSelect,
}: MenuCategoryCardProps) {
  const cover = categoryCoverImage(category);
  const count = category.items.length;

  const card = (
    <button
      type="button"
      onClick={() => onSelect(category.id)}
      className={cn(
        "public-menu-category-card group",
        "motion-safe:active:scale-[0.98]",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]",
      )}
    >
      <div className="relative aspect-[5/4] w-full bg-[var(--color-cream-100)]">
        {cover ? (
          <PublicMenuImage
            src={cover}
            alt=""
            sizes="(max-width: 768px) 100vw, 320px"
            className="motion-safe:transition-transform motion-safe:duration-700 motion-safe:group-hover:scale-[1.04]"
          />
        ) : (
          <div className="public-menu-category-card-fallback flex h-full items-center justify-center">
            <UtensilsCrossed className="h-12 w-12 opacity-30" strokeWidth={1} aria-hidden />
          </div>
        )}

        <div className="public-menu-category-card-overlay absolute inset-0" aria-hidden />

        <div className="absolute left-3 top-3">
          <span className="public-menu-category-count">
            {count} {count === 1 ? "dish" : "dishes"}
          </span>
        </div>

        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 pt-12">
          <div className="min-w-0">
            <h2 className="text-xl font-bold tracking-tight text-white drop-shadow-sm">
              {category.name}
            </h2>
            <p className="mt-1 text-xs font-medium text-white/80">Tap to view menu</p>
          </div>
          <span className="public-menu-category-chevron flex h-11 w-11 shrink-0 items-center justify-center rounded-full shadow-lg motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5">
            <ChevronRight className="h-5 w-5" strokeWidth={2.5} aria-hidden />
          </span>
        </div>
      </div>
    </button>
  );

  if (reducedMotion) return card;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.45,
        delay: motionListDelay(index, 0.07),
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {card}
    </motion.div>
  );
}

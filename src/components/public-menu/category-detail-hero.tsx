"use client";

import { forwardRef } from "react";
import { ArrowLeft, UtensilsCrossed } from "lucide-react";
import { PublicMenuImage } from "./public-menu-image";

type CategoryDetailHeroProps = {
  categoryName: string;
  itemCount: number;
  coverImage: string | null;
  onBack: () => void;
  showBack?: boolean;
};

export const CategoryDetailHero = forwardRef<HTMLHeadingElement, CategoryDetailHeroProps>(
  function CategoryDetailHero(
    { categoryName, itemCount, coverImage, onBack, showBack = true },
    ref,
  ) {
    return (
      <div className="public-menu-category-hero">
        {coverImage ? (
          <PublicMenuImage
            src={coverImage}
            alt=""
            sizes="(max-width: 640px) 100vw, 640px"
          />
        ) : (
          <div className="public-menu-category-hero-fallback flex h-full items-center justify-center">
            <UtensilsCrossed className="h-14 w-14 opacity-25" aria-hidden />
          </div>
        )}
        <div className="public-menu-category-hero-overlay" aria-hidden />

        <div className="absolute inset-0 flex flex-col justify-between p-4">
          {showBack ? (
            <button
              type="button"
              onClick={onBack}
              aria-label="Back to categories"
              className="public-menu-back-fab touch-target w-fit"
            >
              <ArrowLeft className="h-5 w-5" strokeWidth={2} aria-hidden />
            </button>
          ) : (
            <div aria-hidden />
          )}

          <div>
            <p className="mb-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-white/90">
              Category
            </p>
            <h2
              ref={ref}
              tabIndex={-1}
              className="text-2xl font-bold tracking-tight text-white drop-shadow-md outline-none"
            >
              {categoryName}
            </h2>
            <p className="mt-1 text-sm font-medium text-white/80">
              {itemCount} {itemCount === 1 ? "item" : "items"} on the menu
            </p>
          </div>
        </div>
      </div>
    );
  },
);

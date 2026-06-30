"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import type { PublicMenuData, PublicMenuItem } from "@/src/services/public-menu-api";
import { CategoryDetailHero } from "./category-detail-hero";
import { DigitalMenuHeader } from "./digital-menu-header";
import { MenuCategoryCard } from "./menu-category-card";
import { MenuItemRow } from "./menu-item-row";
import { MenuItemSheet } from "./menu-item-sheet";
import { MenuSearchBar } from "./menu-search-bar";
import { PublicMenuEmptyState } from "./public-menu-empty-state";
import { PublicMenuFooter } from "./public-menu-footer";
import { PublicMenuContentSkeleton } from "./public-menu-content-skeleton";
import { categoryCoverImage, itemMatchesSearchWithCategory } from "./public-menu-utils";
import { SPECIALS_SECTION_LABEL } from "@/src/lib/menu-catalog-layout";

function subscribeReducedMotion(cb: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function getReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServer() {
  return false;
}

type PublicMenuViewProps = {
  data: PublicMenuData;
};

export function PublicMenuView({ data }: PublicMenuViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const categoryIdFromUrl = searchParams.get("category");
  const qFromUrl = searchParams.get("q") ?? "";
  const selectedCategoryId = categoryIdFromUrl;
  const search = qFromUrl;
  const [activeCategoryByScroll, setActiveCategoryByScroll] = useState<string | null>(categoryIdFromUrl);
  const [selectedItem, setSelectedItem] = useState<PublicMenuItem | null>(null);
  const [selectedItemCategory, setSelectedItemCategory] = useState<string | undefined>();
  const [pressedCategoryId, setPressedCategoryId] = useState<string | null | undefined>(undefined);
  const [isFilterPending, startFilterTransition] = useTransition();

  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const chipRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    getReducedMotionServer,
  );

  const updateUrl = useCallback(
    (categoryId: string | null, query: string) => {
      const params = new URLSearchParams();
      if (categoryId) params.set("category", categoryId);
      if (query.trim()) params.set("q", query.trim());
      const qs = params.toString();
      startFilterTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    },
    [pathname, router],
  );

  const totalItems = data.categories.reduce((n, c) => n + c.items.length, 0);
  const normalizedQuery = search.trim();
  const activeCategory = useMemo(
    () => data.categories.find((category) => category.id === selectedCategoryId) ?? null,
    [data.categories, selectedCategoryId],
  );

  const filteredSpecials = useMemo(() => {
    return data.specials.filter((item) =>
      itemMatchesSearchWithCategory(item, SPECIALS_SECTION_LABEL, normalizedQuery),
    );
  }, [data.specials, normalizedQuery]);

  const categoriesForGrid = useMemo(() => {
    if (!normalizedQuery) return data.categories;
    return data.categories.filter((category) =>
      category.items.some((item) =>
        itemMatchesSearchWithCategory(item, category.name, normalizedQuery),
      ),
    );
  }, [data.categories, normalizedQuery]);

  const filteredCategories = useMemo(() => {
    return data.categories
      .map((category) => {
        const visibleItems = category.items.filter((item) =>
          itemMatchesSearchWithCategory(item, category.name, normalizedQuery),
        );
        return { ...category, visibleItems };
      })
      .filter((category) => category.visibleItems.length > 0);
  }, [data.categories, normalizedQuery]);

  const displayedCategories = useMemo(() => {
    if (!selectedCategoryId) return filteredCategories;
    return filteredCategories.filter((category) => category.id === selectedCategoryId);
  }, [filteredCategories, selectedCategoryId]);

  const allFilteredItemsCount = useMemo(
    () => filteredCategories.reduce((acc, category) => acc + category.visibleItems.length, 0),
    [filteredCategories],
  );

  const effectiveActiveChip =
    isFilterPending && pressedCategoryId !== undefined
      ? pressedCategoryId
      : (categoryIdFromUrl ?? activeCategoryByScroll);
  const showCategoryGrid = selectedCategoryId === null;
  const isCategoryDetail = selectedCategoryId !== null;
  const isCategoryFiltering = isFilterPending && pressedCategoryId !== undefined;
  const isContentLoading = isFilterPending;

  const pressedCategory = useMemo(
    () =>
      pressedCategoryId
        ? (data.categories.find((category) => category.id === pressedCategoryId) ?? null)
        : null,
    [data.categories, pressedCategoryId],
  );

  const skeletonVariant = useMemo((): "grid" | "category" | "items" => {
    if (!isFilterPending) return "items";
    if (pressedCategoryId === null) return "grid";
    if (pressedCategoryId) return "category";
    return "items";
  }, [isFilterPending, pressedCategoryId]);

  const handleSearchChange = (value: string) => {
    setPressedCategoryId(undefined);
    updateUrl(selectedCategoryId, value);
  };

  const scrollToTop = useCallback(
    (behavior: ScrollBehavior = reducedMotion ? "auto" : "instant") => {
      window.scrollTo({ top: 0, left: 0, behavior });
    },
    [reducedMotion],
  );

  const handleCategorySelect = (categoryId: string | null) => {
    setPressedCategoryId(categoryId);
    setActiveCategoryByScroll(categoryId);
    setSelectedItem(null);
    updateUrl(categoryId, search);
    if (categoryId === null) {
      scrollToTop();
    }
  };

  useEffect(() => {
    if (!selectedCategoryId) return;
    scrollToTop();
  }, [scrollToTop, selectedCategoryId]);

  const handleBackToCategories = () => {
    setPressedCategoryId(null);
    setActiveCategoryByScroll(null);
    setSelectedItem(null);
    updateUrl(null, "");
    scrollToTop();
  };

  useEffect(() => {
    if (!isCategoryDetail) return;
    const categoriesToObserve = displayedCategories;
    if (categoriesToObserve.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (!visible.length) return;
        const nextId = visible[0]?.target.getAttribute("data-category-id");
        if (!nextId) return;
        setActiveCategoryByScroll((prev) => (prev === nextId ? prev : nextId));
      },
      { threshold: [0.2, 0.4, 0.6], rootMargin: "-42% 0px -45% 0px" },
    );
    for (const category of categoriesToObserve) {
      const el = sectionRefs.current[category.id];
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [displayedCategories, isCategoryDetail]);

  useEffect(() => {
    const activeKey = effectiveActiveChip ?? "all";
    const chip = chipRefs.current[activeKey];
    chip?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [effectiveActiveChip]);

  const displayCategory = activeCategory ?? pressedCategory;
  const showCategoryChrome =
    displayCategory !== null && (isCategoryDetail || (isFilterPending && pressedCategoryId !== undefined));

  const handleItemSelect = (item: PublicMenuItem, categoryName?: string) => {
    setSelectedItem(item);
    setSelectedItemCategory(categoryName);
  };

  return (
    <div className="public-menu-shell safe-bottom pb-10">
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {isContentLoading
          ? isCategoryFiltering
            ? `Loading ${pressedCategory?.name ?? "category"} menu.`
            : "Updating menu results."
          : ""}
      </p>

      <DigitalMenuHeader
        cafeName={data.cafe.cafeName}
        logo={data.cafe.logo}
        subtitle={showCategoryChrome ? displayCategory?.name ?? "Menu" : "Select a category to explore"}
        compact={showCategoryChrome}
      />

      {activeCategory && !isCategoryFiltering ? (
        <CategoryDetailHero
          categoryName={activeCategory.name}
          itemCount={displayedCategories[0]?.visibleItems.length ?? 0}
          coverImage={categoryCoverImage(activeCategory)}
          onBack={handleBackToCategories}
          showBack={data.categories.length > 1}
        />
      ) : null}

      {totalItems > 0 ? (
        <div
          className={`public-menu-sticky-nav public-menu-edge-pad py-3${isContentLoading ? " is-filtering" : ""}`}
        >
          <MenuSearchBar value={search} onChange={handleSearchChange} placeholder="Search dishes or categories…" />
          <div className="public-menu-chip-scroll mt-3" role="tablist" aria-label="Menu categories">
            <button
              type="button"
              ref={(node) => {
                chipRefs.current.all = node;
              }}
              className={`public-menu-category-chip${effectiveActiveChip === null ? " is-active" : ""}${isCategoryFiltering && pressedCategoryId === null ? " is-loading" : ""}`}
              aria-pressed={effectiveActiveChip === null}
              onClick={() => {
                if (isCategoryDetail) handleCategorySelect(null);
                else scrollToTop();
              }}
            >
              All
            </button>
            {data.categories.map((category) => {
              const chipActive = effectiveActiveChip === category.id;
              const chipLoading = isCategoryFiltering && pressedCategoryId === category.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  ref={(node) => {
                    chipRefs.current[category.id] = node;
                  }}
                  className={`public-menu-category-chip${chipActive ? " is-active" : ""}${chipLoading ? " is-loading" : ""}`}
                  aria-pressed={chipActive}
                  onClick={() => handleCategorySelect(category.id)}
                >
                  {category.name}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="public-menu-content min-h-[40vh]" aria-busy={isContentLoading}>
        {totalItems === 0 ? (
          <div className="public-menu-edge-pad">
            <PublicMenuEmptyState variant="oos" />
          </div>
        ) : isContentLoading ? (
          <PublicMenuContentSkeleton variant={skeletonVariant} />
        ) : showCategoryGrid ? (
          <>
            {filteredSpecials.length > 0 ? (
              <motion.section
                className="public-menu-specials-section"
                aria-label={SPECIALS_SECTION_LABEL}
                initial={reducedMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="public-menu-edge-pad">
                  <div className="public-menu-category-section-head">
                    <h2 className="public-menu-category-section-title">{SPECIALS_SECTION_LABEL}</h2>
                    <p className="public-menu-category-section-count">
                      {filteredSpecials.length} item{filteredSpecials.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="public-menu-ornament public-menu-text-muted mb-3 text-[10px] font-semibold uppercase tracking-[0.18em]">
                    <span className="shrink-0 px-2">Highlighted today</span>
                  </div>
                  <div className="public-menu-item-list">
                    {filteredSpecials.map((item, index) => (
                      <MenuItemRow
                        key={item.catalogItemId}
                        item={item}
                        index={index}
                        reducedMotion={reducedMotion}
                        onSelect={(selected) => handleItemSelect(selected, SPECIALS_SECTION_LABEL)}
                      />
                    ))}
                  </div>
                </div>
              </motion.section>
            ) : null}

            <div className="public-menu-edge-pad pt-3">
            {categoriesForGrid.length > 0 ? (
              <>
                <div className="public-menu-ornament public-menu-text-muted mb-5 text-[10px] font-semibold uppercase tracking-[0.18em]">
                  <span className="shrink-0 px-2">Categories</span>
                </div>
                <div className="public-menu-category-grid">
                  {categoriesForGrid.map((category, index) => (
                    <MenuCategoryCard
                      key={category.id}
                      category={category}
                      index={index}
                      reducedMotion={reducedMotion}
                      onSelect={(id) => handleCategorySelect(id)}
                    />
                  ))}
                </div>
              </>
            ) : filteredSpecials.length === 0 && normalizedQuery ? (
              <PublicMenuEmptyState
                variant="search"
                searchQuery={normalizedQuery}
                onClearSearch={() => handleSearchChange("")}
              />
            ) : null}
            </div>
          </>
        ) : allFilteredItemsCount === 0 ? (
          <PublicMenuEmptyState
            variant="search"
            searchQuery={normalizedQuery}
            onClearSearch={() => {
              handleSearchChange("");
              updateUrl(null, "");
            }}
          />
        ) : (
          <div className="public-menu-sections public-menu-edge-pad pt-3">
            {displayedCategories.map((category) => (
              <motion.section
                key={category.id}
                data-category-id={category.id}
                ref={(node) => {
                  sectionRefs.current[category.id] = node;
                }}
                initial={reducedMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25 }}
                className="public-menu-category-section"
                aria-label={category.name}
              >
                <div className="public-menu-category-section-head">
                  <h2 className="public-menu-category-section-title">{category.name}</h2>
                  <p className="public-menu-category-section-count">
                    {category.visibleItems.length} item{category.visibleItems.length === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="public-menu-ornament public-menu-text-muted mb-4 text-[10px] font-semibold uppercase tracking-[0.18em]">
                  <span className="shrink-0 px-2">Featured Selection</span>
                </div>
                <div className="public-menu-item-list">
                  {category.visibleItems.map((item, index) => (
                    <MenuItemRow
                      key={item.catalogItemId}
                      item={item}
                      categoryName={selectedCategoryId ? undefined : category.name}
                      index={index}
                      reducedMotion={reducedMotion}
                      onSelect={(selected) => handleItemSelect(selected, category.name)}
                    />
                  ))}
                </div>
              </motion.section>
            ))}
          </div>
        )}
      </div>

      <PublicMenuFooter
        cafeName={data.cafe.cafeName}
        address={data.cafe.address}
        contactNumber={data.cafe.contactNumber}
      />

      <MenuItemSheet item={selectedItem} categoryName={selectedItemCategory} onClose={() => setSelectedItem(null)} />
    </div>
  );
}
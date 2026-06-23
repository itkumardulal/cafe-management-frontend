"use client";



import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { AnimatePresence, motion } from "framer-motion";

import type { PublicMenuData, PublicMenuItem } from "@/src/services/public-menu-api";

import { CategoryDetailHero } from "./category-detail-hero";

import { DigitalMenuHeader } from "./digital-menu-header";

import { MenuCategoryCard } from "./menu-category-card";

import { MenuItemRow } from "./menu-item-row";

import { MenuItemSheet } from "./menu-item-sheet";

import { MenuSearchBar } from "./menu-search-bar";

import { PublicMenuEmptyState } from "./public-menu-empty-state";

import { PublicMenuFooter } from "./public-menu-footer";

import { categoryCoverImage, itemMatchesSearch } from "./public-menu-utils";



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



type SearchResult = {

  item: PublicMenuItem;

  categoryName: string;

};



type PublicMenuViewProps = {

  data: PublicMenuData;

};



export function PublicMenuView({ data }: PublicMenuViewProps) {

  const router = useRouter();

  const pathname = usePathname();

  const searchParams = useSearchParams();



  const categoryIdFromUrl = searchParams.get("category");

  const qFromUrl = searchParams.get("q") ?? "";



  const [search, setSearch] = useState(qFromUrl);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(categoryIdFromUrl);

  const [selectedItem, setSelectedItem] = useState<PublicMenuItem | null>(null);

  const [selectedItemCategory, setSelectedItemCategory] = useState<string | undefined>();

  const categoryHeadingRef = useRef<HTMLHeadingElement>(null);

  const singleCategoryApplied = useRef(false);



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

      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });

    },

    [pathname, router],

  );



  useEffect(() => {

    setSearch(qFromUrl);

    setSelectedCategoryId(categoryIdFromUrl);

  }, [categoryIdFromUrl, qFromUrl]);



  useEffect(() => {

    if (singleCategoryApplied.current) return;

    if (data.categories.length !== 1) return;

    if (categoryIdFromUrl || qFromUrl.trim()) return;



    singleCategoryApplied.current = true;

    const onlyCategory = data.categories[0]!;

    setSelectedCategoryId(onlyCategory.id);

    updateUrl(onlyCategory.id, "");

  }, [categoryIdFromUrl, data.categories, qFromUrl, updateUrl]);



  const activeCategory = useMemo(

    () => data.categories.find((c) => c.id === selectedCategoryId) ?? null,

    [data.categories, selectedCategoryId],

  );



  const totalItems = data.categories.reduce((n, c) => n + c.items.length, 0);

  const isSearchActive = search.trim().length > 0;

  const isGlobalSearch = isSearchActive && selectedCategoryId === null;

  const isCategoryDetail = selectedCategoryId !== null && !isGlobalSearch;

  const showCategoryList = !isGlobalSearch && !isCategoryDetail && data.categories.length > 1;



  const searchResults = useMemo((): SearchResult[] => {
    const q = search.trim();
    if (!q) return [];
    const seen = new Set<string>();
    const results: SearchResult[] = [];
    for (const cat of data.categories) {
      for (const item of cat.items) {
        if (!itemMatchesSearch(item, q)) continue;
        if (seen.has(item.catalogItemId)) continue;
        seen.add(item.catalogItemId);
        results.push({ item, categoryName: cat.name });
      }
    }
    return results;
  }, [data.categories, search]);



  const categoryItems = useMemo(() => {

    if (!activeCategory) return [];

    const q = search.trim();

    if (!q) return activeCategory.items;

    return activeCategory.items.filter((item) => itemMatchesSearch(item, q));

  }, [activeCategory, search]);



  useEffect(() => {

    if (isCategoryDetail && activeCategory) {

      categoryHeadingRef.current?.focus();

    }

  }, [activeCategory, isCategoryDetail, selectedCategoryId]);



  const handleSearchChange = (value: string) => {

    setSearch(value);

    updateUrl(selectedCategoryId, value);

  };



  const handleBack = () => {

    setSelectedCategoryId(null);

    setSearch("");

    setSelectedItem(null);

    updateUrl(null, "");

  };



  const handleCategorySelect = (categoryId: string) => {

    setSelectedCategoryId(categoryId);

    setSearch("");

    setSelectedItem(null);

    updateUrl(categoryId, "");

  };



  const handleItemSelect = (item: PublicMenuItem, categoryName?: string) => {

    setSelectedItem(item);

    setSelectedItemCategory(categoryName ?? activeCategory?.name);

  };



  const headerSubtitle = isGlobalSearch

    ? "Find your favourite dish"

    : isCategoryDetail

      ? activeCategory?.name ?? "Menu"

      : data.categories.length === 1

        ? activeCategory?.name ?? "Browse our menu"

        : "Select a category to begin";



  return (

    <div className="public-menu-shell safe-bottom pb-10">

      {!isCategoryDetail ? (

        <DigitalMenuHeader

          cafeName={data.cafe.cafeName}

          logo={data.cafe.logo}

          subtitle={headerSubtitle}

        />

      ) : (

        <DigitalMenuHeader

          cafeName={data.cafe.cafeName}

          logo={data.cafe.logo}

          subtitle={headerSubtitle}

          compact

        />

      )}



      {isCategoryDetail && activeCategory ? (

        <CategoryDetailHero

          ref={categoryHeadingRef}

          categoryName={activeCategory.name}

          itemCount={categoryItems.length}

          coverImage={categoryCoverImage(activeCategory)}

          onBack={handleBack}

          showBack={data.categories.length > 1}

        />

      ) : null}



      {totalItems > 0 ? (

        <div className="public-menu-sticky-nav px-4 py-3.5">

          <MenuSearchBar

            value={search}

            onChange={handleSearchChange}

            placeholder={

              isCategoryDetail ? "Search in this category…" : "Search all dishes…"

            }

          />

        </div>

      ) : null}



      <div className="min-h-[40vh]">

        {totalItems === 0 ? (

          <PublicMenuEmptyState variant="oos" />

        ) : isGlobalSearch ? (

          <AnimatePresence mode="wait">

            <motion.div

              key="search"

              initial={reducedMotion ? false : { opacity: 0, y: 8 }}

              animate={{ opacity: 1, y: 0 }}

              exit={reducedMotion ? undefined : { opacity: 0 }}

              transition={{ duration: 0.28 }}

              className="px-4 pt-2"

            >

              <p className="public-menu-eyebrow mb-3 px-1">

                {searchResults.length} result{searchResults.length === 1 ? "" : "s"}

              </p>

              <div className="public-menu-item-list">

                {searchResults.length === 0 ? (

                  <PublicMenuEmptyState

                    variant="search"

                    searchQuery={search.trim()}

                    onClearSearch={() => handleSearchChange("")}

                  />

                ) : (

                  searchResults.map(({ item, categoryName }, i) => (

                    <MenuItemRow

                      key={item.catalogItemId}

                      item={item}

                      categoryName={categoryName}

                      index={i}

                      reducedMotion={reducedMotion}

                      onSelect={(selected) => handleItemSelect(selected, categoryName)}

                    />

                  ))

                )}

              </div>

            </motion.div>

          </AnimatePresence>

        ) : isCategoryDetail ? (

          <AnimatePresence mode="wait">

            <motion.div

              key={selectedCategoryId}

              initial={reducedMotion ? false : { opacity: 0, y: 12 }}

              animate={{ opacity: 1, y: 0 }}

              exit={reducedMotion ? undefined : { opacity: 0, y: -8 }}

              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}

              className="px-4 pt-2"

            >

              <div className="public-menu-item-list">

                {categoryItems.length === 0 ? (

                  isSearchActive ? (

                    <PublicMenuEmptyState

                      variant="search"

                      searchQuery={search.trim()}

                      onClearSearch={() => handleSearchChange("")}

                    />

                  ) : (

                    <PublicMenuEmptyState variant="oos" />

                  )

                ) : (

                  categoryItems.map((item, i) => (

                    <MenuItemRow

                      key={item.catalogItemId}

                      item={item}

                      index={i}

                      reducedMotion={reducedMotion}

                      onSelect={(selected) => handleItemSelect(selected)}

                    />

                  ))

                )}

              </div>

            </motion.div>

          </AnimatePresence>

        ) : showCategoryList ? (

          <AnimatePresence mode="wait">

            <motion.div

              key="categories"

              initial={reducedMotion ? false : { opacity: 0, y: 8 }}

              animate={{ opacity: 1, y: 0 }}

              exit={reducedMotion ? undefined : { opacity: 0 }}

              transition={{ duration: 0.28 }}

              className="px-4 pt-2"

            >

              {data.specials.length > 0 ? (
                <section className="mb-6" aria-label="Chef specials">
                  <div className="public-menu-ornament public-menu-text-muted mb-3 text-[10px] font-semibold uppercase tracking-[0.18em]">
                    <span className="shrink-0 px-2">Specials</span>
                  </div>
                  <div className="public-menu-item-list">
                    {data.specials.map((item, i) => (
                      <MenuItemRow
                        key={item.catalogItemId}
                        item={item}
                        index={i}
                        reducedMotion={reducedMotion}
                        onSelect={(selected) => handleItemSelect(selected, "Specials")}
                      />
                    ))}
                  </div>
                </section>
              ) : null}

              <div className="public-menu-ornament public-menu-text-muted mb-5 text-[10px] font-semibold uppercase tracking-[0.18em]">

                <span className="shrink-0 px-2">Categories</span>

              </div>

              <div className="public-menu-category-grid">

                {data.categories.map((cat, i) => (

                  <MenuCategoryCard

                    key={cat.id}

                    category={cat}

                    index={i}

                    reducedMotion={reducedMotion}

                    onSelect={handleCategorySelect}

                  />

                ))}

              </div>

            </motion.div>

          </AnimatePresence>

        ) : null}

      </div>



      <PublicMenuFooter

        cafeName={data.cafe.cafeName}

        address={data.cafe.address}

        contactNumber={data.cafe.contactNumber}

      />



      <MenuItemSheet

        item={selectedItem}

        categoryName={selectedItemCategory}

        onClose={() => setSelectedItem(null)}

      />

    </div>

  );

}



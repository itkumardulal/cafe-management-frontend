export const SPECIALS_FILTER_ID = '__specials__';
export const SPECIALS_SECTION_LABEL = "Today's Special";

export type CatalogCategory = {
  id: string;
  name: string;
  sortOrder: number;
};

export type CatalogMenuItem = {
  id: string;
  name: string;
  sellPricePerUnit: string;
  trackStock: boolean;
  quantityOnHand: string | null;
  imageUrl?: string | null;
  isSpecial: boolean;
  specialSortOrder: number;
  categoryIds: string[];
  primaryCategoryId: string;
};

export type CatalogSection<T extends CatalogMenuItem = CatalogMenuItem> = {
  id: string;
  title: string;
  items: T[];
};

export type BuildCatalogSectionsOptions = {
  categoryFilter?: string;
  search?: string;
};

function sortItems<T extends CatalogMenuItem>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    if (a.isSpecial !== b.isSpecial) return a.isSpecial ? -1 : 1;
    if (a.specialSortOrder !== b.specialSortOrder) {
      return a.specialSortOrder - b.specialSortOrder;
    }
    return a.name.localeCompare(b.name);
  });
}

function sortCategories(categories: CatalogCategory[]): CatalogCategory[] {
  return [...categories].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.name.localeCompare(b.name);
  });
}

export function filterCatalogBySearch<T extends CatalogMenuItem>(
  items: T[],
  search: string,
): T[] {
  const q = search.trim().toLowerCase();
  if (!q) return [];

  const seen = new Set<string>();
  const deduped: T[] = [];
  for (const item of items) {
    if (!item.name.toLowerCase().includes(q)) continue;
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    deduped.push(item);
  }
  return sortItems(deduped);
}

export function buildCatalogSections<T extends CatalogMenuItem>(
  categories: CatalogCategory[],
  items: T[],
  options: BuildCatalogSectionsOptions = {},
): CatalogSection<T>[] {
  const { categoryFilter = '', search = '' } = options;

  if (search.trim()) {
    const matches = filterCatalogBySearch(items, search);
    return matches.length > 0
      ? [{ id: '__search__', title: 'Search results', items: matches }]
      : [];
  }

  if (categoryFilter === SPECIALS_FILTER_ID) {
    const specials = sortItems(items.filter((i) => i.isSpecial));
    return specials.length > 0
      ? [{ id: SPECIALS_FILTER_ID, title: SPECIALS_SECTION_LABEL, items: specials }]
      : [];
  }

  if (categoryFilter) {
    const filtered = sortItems(items.filter((i) => i.categoryIds.includes(categoryFilter)));
    const cat = categories.find((c) => c.id === categoryFilter);
    return filtered.length > 0
      ? [{ id: categoryFilter, title: cat?.name ?? 'Category', items: filtered }]
      : [];
  }

  const sections: CatalogSection<T>[] = [];
  const specials = sortItems(items.filter((i) => i.isSpecial));
  if (specials.length > 0) {
    sections.push({ id: SPECIALS_FILTER_ID, title: SPECIALS_SECTION_LABEL, items: specials });
  }

  for (const cat of sortCategories(categories)) {
    const catItems = sortItems(items.filter((i) => i.categoryIds.includes(cat.id)));
    if (catItems.length > 0) {
      sections.push({ id: cat.id, title: cat.name, items: catItems });
    }
  }

  return sections;
}

export function buildCategoryChips(
  categories: CatalogCategory[],
  items: CatalogMenuItem[],
): Array<{ id: string; label: string }> {
  const chips: Array<{ id: string; label: string }> = [];
  if (items.some((i) => i.isSpecial)) {
    chips.push({ id: SPECIALS_FILTER_ID, label: SPECIALS_SECTION_LABEL });
  }
  for (const cat of sortCategories(categories)) {
    if (items.some((i) => i.categoryIds.includes(cat.id))) {
      chips.push({ id: cat.id, label: cat.name });
    }
  }
  return chips;
}

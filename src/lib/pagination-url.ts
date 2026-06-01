import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
  type PageSizeOption,
  getStoredPageSize,
} from "./pagination-storage";

export type SortOrder = "asc" | "desc";

export type PaginationParams = {
  page: number;
  limit: PageSizeOption;
  search: string;
  sortBy?: string;
  sortOrder?: SortOrder;
  filters: Record<string, string>;
};

export type PaginationUrlConfig = {
  pageKey?: string;
  limitKey?: string;
  searchKey?: string;
  sortByKey?: string;
  sortOrderKey?: string;
  filterKeys?: string[];
};

const DEFAULT_URL_CONFIG: Required<Omit<PaginationUrlConfig, "filterKeys">> & {
  filterKeys: string[];
} = {
  pageKey: "page",
  limitKey: "limit",
  searchKey: "search",
  sortByKey: "sortBy",
  sortOrderKey: "sortOrder",
  filterKeys: [],
};

function parsePositiveInt(value: string | null, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }
  return Math.floor(parsed);
}

function parsePageSize(value: string | null, storageKey: string): PageSizeOption {
  if (value) {
    const parsed = Number(value);
    if (PAGE_SIZE_OPTIONS.includes(parsed as PageSizeOption)) {
      return parsed as PageSizeOption;
    }
  }
  return getStoredPageSize(storageKey);
}

export function parsePaginationParams(
  searchParams: URLSearchParams,
  storageKey: string,
  config: PaginationUrlConfig = {},
  defaultSort?: { sortBy: string; sortOrder: SortOrder },
): PaginationParams {
  const merged = { ...DEFAULT_URL_CONFIG, ...config };
  const filters: Record<string, string> = {};
  for (const key of merged.filterKeys) {
    const value = searchParams.get(key);
    if (value) {
      filters[key] = value;
    }
  }

  const sortBy = searchParams.get(merged.sortByKey) ?? defaultSort?.sortBy;
  const sortOrderRaw = searchParams.get(merged.sortOrderKey);
  const sortOrder: SortOrder | undefined =
    sortOrderRaw === "asc" || sortOrderRaw === "desc"
      ? sortOrderRaw
      : defaultSort?.sortOrder;

  return {
    page: parsePositiveInt(searchParams.get(merged.pageKey), 1),
    limit: parsePageSize(searchParams.get(merged.limitKey), storageKey),
    search: searchParams.get(merged.searchKey)?.trim() ?? "",
    sortBy,
    sortOrder,
    filters,
  };
}

export function buildPaginationSearchParams(
  params: PaginationParams,
  config: PaginationUrlConfig = {},
): URLSearchParams {
  const merged = { ...DEFAULT_URL_CONFIG, ...config };
  const next = new URLSearchParams();

  if (params.page > 1) {
    next.set(merged.pageKey, String(params.page));
  }
  if (params.limit !== DEFAULT_PAGE_SIZE) {
    next.set(merged.limitKey, String(params.limit));
  }
  if (params.search) {
    next.set(merged.searchKey, params.search);
  }
  if (params.sortBy) {
    next.set(merged.sortByKey, params.sortBy);
  }
  if (params.sortOrder) {
    next.set(merged.sortOrderKey, params.sortOrder);
  }
  for (const key of merged.filterKeys) {
    const value = params.filters[key];
    if (value) {
      next.set(key, value);
    }
  }

  return next;
}

export function serializePaginationParams(
  params: PaginationParams,
  config: PaginationUrlConfig = {},
): string {
  const built = buildPaginationSearchParams(params, config);
  const query = built.toString();
  return query ? `?${query}` : "";
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebouncedValue } from "@/src/hooks/use-debounced-value";
import { getApiErrorMessage } from "@/src/lib/api-error";
import {
  buildPaginationSearchParams,
  parsePaginationParams,
  type PaginationParams,
  type PaginationUrlConfig,
  type SortOrder,
} from "@/src/lib/pagination-url";
import {
  DEFAULT_PAGE_SIZE,
  type PageSizeOption,
  setStoredPageSize,
} from "@/src/lib/pagination-storage";
import { appToast } from "@/src/lib/toast";
import {
  formatSearchResultSummary,
  getListSearchPlaceholder,
  normalizeSearchInput,
  SEARCH_DEBOUNCE_MS,
} from "@/src/lib/search";

export type PaginatedMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PaginatedResult<T> = {
  items: T[];
  meta: PaginatedMeta;
};

export type ListFetchParams = {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder?: SortOrder;
  [key: string]: string | number | undefined;
};

type UsePaginatedListOptions<T> = {
  queryKey: string;
  fetchFn: (params: ListFetchParams) => Promise<PaginatedResult<T>>;
  defaultSort?: { sortBy: string; sortOrder: SortOrder };
  filterKeys?: string[];
  urlConfig?: PaginationUrlConfig;
  enabled?: boolean;
  errorMessage?: string;
  searchPlaceholder?: string;
};

export function usePaginatedList<T>({
  queryKey,
  fetchFn,
  defaultSort,
  filterKeys = [],
  urlConfig,
  enabled = true,
  errorMessage = "Failed to load data",
  searchPlaceholder,
}: UsePaginatedListOptions<T>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filterKeysKey = filterKeys.join("\0");
  const urlConfigKey = JSON.stringify(urlConfig ?? {});
  const defaultSortBy = defaultSort?.sortBy;
  const defaultSortOrder = defaultSort?.sortOrder;
  const resolvedDefaultSort = useMemo(
    () =>
      defaultSortBy && defaultSortOrder
        ? { sortBy: defaultSortBy, sortOrder: defaultSortOrder }
        : undefined,
    [defaultSortBy, defaultSortOrder],
  );

  const mergedUrlConfig = useMemo(
    () => ({ filterKeys, ...urlConfig }),
    // filterKeysKey / urlConfigKey avoid refetch loops from inline array/object literals at call sites
    [filterKeys, filterKeysKey, urlConfig, urlConfigKey],
  );

  const params = useMemo(
    () =>
      parsePaginationParams(
        searchParams,
        queryKey,
        mergedUrlConfig,
        resolvedDefaultSort,
      ),
    [searchParams, queryKey, mergedUrlConfig, resolvedDefaultSort],
  );

  const [searchInput, setSearchInput] = useState(params.search);
  const normalizedSearchInput = useMemo(
    () => normalizeSearchInput(searchInput),
    [searchInput],
  );
  const debouncedSearch = useDebouncedValue(normalizedSearchInput, SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    setSearchInput(params.search);
  }, [params.search]);

  const [items, setItems] = useState<T[]>([]);
  const [meta, setMeta] = useState<PaginatedMeta>({
    page: 1,
    limit: DEFAULT_PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const initialLoadRef = useRef(true);

  const effectiveParams = useMemo(
    () => ({ ...params, search: debouncedSearch }),
    [params, debouncedSearch],
  );

  const paramsRef = useRef(params);
  paramsRef.current = params;

  const effectiveParamsRef = useRef(effectiveParams);
  effectiveParamsRef.current = effectiveParams;

  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  const replaceParams = useCallback(
    (next: Partial<PaginationParams> & { resetPage?: boolean }) => {
      const current = paramsRef.current;
      const merged: PaginationParams = {
        ...current,
        ...next,
        filters: next.filters ?? current.filters,
        page: next.resetPage ? 1 : (next.page ?? current.page),
      };
      if (next.limit) {
        setStoredPageSize(queryKey, next.limit);
      }
      const built = buildPaginationSearchParams(merged, mergedUrlConfig);
      const query = built.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [queryKey, mergedUrlConfig, pathname, router],
  );

  const replaceParamsRef = useRef(replaceParams);
  replaceParamsRef.current = replaceParams;

  useEffect(() => {
    if (debouncedSearch === params.search) {
      return;
    }
    replaceParams({ search: debouncedSearch, resetPage: true });
  }, [debouncedSearch, params.search, replaceParams]);

  const fetchParamsKey = useMemo(() => JSON.stringify(effectiveParams), [effectiveParams]);

  const load = useCallback(async () => {
    if (!enabled) {
      return;
    }

    const requestId = ++requestIdRef.current;
    if (initialLoadRef.current) {
      setLoading(true);
    } else {
      setIsFetching(true);
    }
    setError(null);

    const currentParams = effectiveParamsRef.current;
    const apiParams: ListFetchParams = {
      page: currentParams.page,
      limit: currentParams.limit,
      ...(currentParams.search ? { search: currentParams.search } : {}),
      ...(currentParams.sortBy ? { sortBy: currentParams.sortBy } : {}),
      ...(currentParams.sortOrder ? { sortOrder: currentParams.sortOrder } : {}),
      ...currentParams.filters,
    };

    try {
      const result = await fetchFnRef.current(apiParams);
      if (requestId !== requestIdRef.current) {
        return;
      }

      let nextPage = result.meta.page;
      if (result.meta.totalPages > 0 && nextPage > result.meta.totalPages) {
        nextPage = result.meta.totalPages;
        replaceParamsRef.current({ page: nextPage });
      }

      setItems(result.items);
      setMeta({ ...result.meta, page: nextPage });
    } catch (err) {
      if (requestId !== requestIdRef.current) {
        return;
      }
      const message = getApiErrorMessage(err, errorMessage);
      setError(message);
      appToast.error(message);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
        setIsFetching(false);
        initialLoadRef.current = false;
      }
    }
  }, [enabled, errorMessage]);

  useEffect(() => {
    void load();
  }, [fetchParamsKey, enabled, load]);

  const setPage = useCallback(
    (page: number) => replaceParams({ page }),
    [replaceParams],
  );

  const setPageSize = useCallback(
    (limit: PageSizeOption) => replaceParams({ limit, resetPage: true }),
    [replaceParams],
  );

  const setSearch = useCallback((search: string) => {
    setSearchInput(search);
  }, []);

  const setSort = useCallback(
    (sortBy: string, sortOrder: SortOrder) => {
      replaceParams({ sortBy, sortOrder, resetPage: true });
    },
    [replaceParams],
  );

  const toggleSort = useCallback(
    (sortBy: string) => {
      const nextOrder: SortOrder =
        params.sortBy === sortBy && params.sortOrder === "asc" ? "desc" : "asc";
      replaceParams({ sortBy, sortOrder: nextOrder, resetPage: true });
    },
    [params.sortBy, params.sortOrder, replaceParams],
  );

  const setFilter = useCallback(
    (key: string, value: string) => {
      replaceParams({
        filters: { ...params.filters, [key]: value },
        resetPage: true,
      });
    },
    [params.filters, replaceParams],
  );

  const setFilters = useCallback(
    (filters: Record<string, string>, resetPage = true) => {
      replaceParams({ filters, resetPage });
    },
    [replaceParams],
  );

  const clearFilters = useCallback(() => {
    replaceParams({ filters: {}, resetPage: true });
  }, [replaceParams]);

  const refetch = useCallback(async () => {
    await load();
  }, [load]);

  const clearSearch = useCallback(() => {
    setSearchInput("");
    if (params.search) {
      replaceParams({ search: "", resetPage: true });
    }
  }, [params.search, replaceParams]);

  const hasActiveFilters = useMemo(() => {
    return (
      Boolean(effectiveParams.search) ||
      Object.values(effectiveParams.filters).some(Boolean)
    );
  }, [effectiveParams]);

  const isSearching =
    normalizedSearchInput !== debouncedSearch || (isFetching && Boolean(debouncedSearch));

  const searchResultSummary = useMemo(
    () => formatSearchResultSummary(meta.total, debouncedSearch),
    [meta.total, debouncedSearch],
  );

  const resolvedSearchPlaceholder =
    searchPlaceholder ?? getListSearchPlaceholder(queryKey);

  return {
    items,
    meta,
    loading,
    isFetching,
    isSearching,
    error,
    params: effectiveParams,
    searchInput,
    searchPlaceholder: resolvedSearchPlaceholder,
    searchResultSummary,
    hasActiveFilters,
    setPage,
    setPageSize,
    setSearch,
    clearSearch,
    setSort,
    toggleSort,
    setFilter,
    setFilters,
    clearFilters,
    refetch,
  };
}

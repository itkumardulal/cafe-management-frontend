import { fetchDeduped } from "@/src/lib/api-fetch-dedupe";
import type { PaginatedResult } from "@/src/hooks/use-paginated-list";

/**
 * Deduplicates concurrent and rapid-repeat list fetches (Strict Mode, duplicate effects).
 */
export function fetchPaginatedListDeduped<T>(
  cacheKey: string,
  fetcher: () => Promise<PaginatedResult<T>>,
  options?: { force?: boolean },
): Promise<PaginatedResult<T>> {
  return fetchDeduped(cacheKey, fetcher, options);
}

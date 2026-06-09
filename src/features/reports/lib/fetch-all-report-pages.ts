import { EXPORT_MAX_ROWS, EXPORT_PAGE_LIMIT } from "./report-export-constants";

export async function fetchAllReportPages<T>({
  fetchPage,
  pageLimit = EXPORT_PAGE_LIMIT,
  maxRows = EXPORT_MAX_ROWS,
}: {
  fetchPage: (page: number, limit: number) => Promise<{ items: T[]; total: number }>;
  pageLimit?: number;
  maxRows?: number;
}): Promise<{ items: T[]; total: number; truncated: boolean }> {
  const items: T[] = [];
  let total = 0;
  let page = 1;

  while (items.length < maxRows) {
    const remaining = maxRows - items.length;
    const limit = Math.min(pageLimit, remaining);
    const result = await fetchPage(page, limit);
    total = result.total;
    items.push(...result.items);

    if (result.items.length < limit || items.length >= total || items.length >= maxRows) {
      break;
    }
    page += 1;
  }

  return {
    items,
    total,
    truncated: total > items.length,
  };
}

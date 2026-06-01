export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 20;

export type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number];

const STORAGE_PREFIX = "cms.pageSize.";

export function getStoredPageSize(key: string): PageSizeOption {
  if (typeof window === "undefined") {
    return DEFAULT_PAGE_SIZE;
  }
  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    const parsed = Number(raw);
    if (PAGE_SIZE_OPTIONS.includes(parsed as PageSizeOption)) {
      return parsed as PageSizeOption;
    }
  } catch {
    // ignore
  }
  return DEFAULT_PAGE_SIZE;
}

export function setStoredPageSize(key: string, size: PageSizeOption): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(`${STORAGE_PREFIX}${key}`, String(size));
  } catch {
    // ignore
  }
}

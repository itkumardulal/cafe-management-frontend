export const SEARCH_MAX_LENGTH = 100;
export const SEARCH_DEBOUNCE_MS = 300;

/** Trim and collapse whitespace for client-side search input. */
export function normalizeSearchInput(value: string): string {
  return value.trim().replace(/\s+/g, ' ').slice(0, SEARCH_MAX_LENGTH);
}

export function formatSearchResultSummary(total: number, search?: string): string | null {
  const term = search?.trim();
  if (!term) {
    return null;
  }
  const noun = total === 1 ? 'result' : 'results';
  return `${total.toLocaleString()} ${noun} for “${term}”`;
}

export const LIST_SEARCH_PLACEHOLDERS: Record<string, string> = {
  'menu-categories': 'Search by category name…',
  'menu-items': 'Search by item or category name…',
  'raw-materials': 'Search by material name…',
  suppliers: 'Search by name or contact person…',
  'raw-material-purchases': 'Search by receipt no. or notes…',
  'expense-items': 'Search by expense item name…',
  'daily-expenses': 'Search by item name or notes…',
  'stock-removals': 'Search by receipt, staff, or notes…',
  'pos-sales': 'Search by receipt, customer name, or phone…',
  users: 'Search by name, email, or staff ID…',
};

export function getListSearchPlaceholder(queryKey: string, fallback = 'Search…'): string {
  return LIST_SEARCH_PLACEHOLDERS[queryKey] ?? fallback;
}

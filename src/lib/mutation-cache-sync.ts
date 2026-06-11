import { invalidateGetCache } from "@/src/lib/api-fetch-dedupe";

const LIST_PREFIXES = [
  "/menu-categories",
  "/menu-items",
  "/catalog-items",
  "/sales",
  "/stock-items",
  "/stock-removals",
  "/raw-material",
  "/direct-purchases",
  "/supplier-bills",
  "/expense",
  "/bank",
  "/customers",
  "/customer-receivables",
  "/dining-tables",
  "/table-orders",
  "/users/staff",
  "/staff-roles",
  "/suppliers",
  "/inventory",
];

function invalidateListCaches(path: string) {
  for (const prefix of LIST_PREFIXES) {
    if (path.startsWith(prefix)) {
      invalidateGetCache(prefix);
    }
  }
}

function dispatchReduxInvalidations(path: string) {
  // Lazy-load store/slices to avoid circular import with operations-api.
  const { store } = require("@/src/store") as typeof import("@/src/store");
  const {
    invalidateBillSettlementAging,
    invalidateDiningTableOptions,
    invalidateMenuCategoryOptions,
    invalidateSellableCatalog,
    invalidateStockRemovalRefs,
  } = require("@/src/store/slices/reference-data.slice") as typeof import("@/src/store/slices/reference-data.slice");
  const { invalidateStockAlerts } =
    require("@/src/store/slices/dashboard.slice") as typeof import("@/src/store/slices/dashboard.slice");
  const { invalidateAnalytics } =
    require("@/src/store/slices/analytics.slice") as typeof import("@/src/store/slices/analytics.slice");

  if (
    path.startsWith("/menu-items") ||
    path.startsWith("/menu-categories") ||
    path.startsWith("/catalog-items")
  ) {
    store.dispatch(invalidateSellableCatalog());
    store.dispatch(invalidateMenuCategoryOptions());
  }

  if (
    path.startsWith("/sales") ||
    path.startsWith("/stock-items") ||
    path.startsWith("/stock-removals") ||
    path.startsWith("/menu-items") ||
    path.startsWith("/raw-material-purchases") ||
    path.startsWith("/direct-purchases") ||
    path.startsWith("/expense") ||
    path.startsWith("/customer-receivables")
  ) {
    store.dispatch(invalidateStockAlerts());
    store.dispatch(invalidateAnalytics());
    invalidateGetCache("/analytics");
  }

  if (
    path.startsWith("/raw-material-purchases") ||
    path.startsWith("/direct-purchases") ||
    path.startsWith("/supplier-bills")
  ) {
    store.dispatch(invalidateBillSettlementAging());
  }

  if (path.startsWith("/stock-removals")) {
    store.dispatch(invalidateStockRemovalRefs());
  }

  if (path.startsWith("/dining-tables") || path.startsWith("/table-orders")) {
    store.dispatch(invalidateDiningTableOptions());
    invalidateGetCache("/table-orders");
  }
}

/** Sync Redux reference data and GET dedupe cache after a mutation. */
export function syncCachesAfterMutation(path: string) {
  invalidateListCaches(path);
  dispatchReduxInvalidations(path);
}

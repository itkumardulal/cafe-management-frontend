import type { MenuItem } from "@/src/types/auth";
import type { UserRole } from "@/src/types/auth";

/** Matches backend inventory / stock-alert menu groups. */
export const STOCK_ALERT_MENU_CODES = new Set([
  "INVENTORY",
  "RAW_MATERIALS",
  "RAW_MATERIAL_PURCHASES",
  "DIRECT_PURCHASES",
  "MENU_ITEMS",
  "STOCK_REMOVALS",
]);

export function canAccessStockAlerts(
  role: UserRole | undefined,
  menus: MenuItem[],
): boolean {
  if (!role || role === "SUPER_ADMIN") {
    return false;
  }
  if (role === "CAFE_ADMIN") {
    return true;
  }
  return menus.some((menu) => STOCK_ALERT_MENU_CODES.has(menu.code));
}

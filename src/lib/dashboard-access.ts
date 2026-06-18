import { DASHBOARD_PERMISSION_CODE } from "@/src/features/users/lib/permissions.config";
import type { MenuItem, UserRole } from "@/src/types/auth";

const DASHBOARD_MENU_CODES = new Set([DASHBOARD_PERMISSION_CODE, "CAFE_OVERVIEW"]);

export function canAccessDashboard(
  role: UserRole | undefined,
  menus: MenuItem[],
): boolean {
  if (!role) {
    return false;
  }
  if (role === "CAFE_ADMIN" || role === "SUPER_ADMIN") {
    return true;
  }
  return menus.some((menu) => DASHBOARD_MENU_CODES.has(menu.code));
}

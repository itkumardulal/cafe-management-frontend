import type { MenuItem } from "@/src/types/auth";
import type { UserRole } from "@/src/types/auth";

export function canAccessAssets(role: UserRole | undefined, menus: MenuItem[]): boolean {
  if (!role || role === "SUPER_ADMIN") {
    return false;
  }
  if (role === "CAFE_ADMIN") {
    return true;
  }
  return menus.some((menu) => menu.code === "ASSETS");
}

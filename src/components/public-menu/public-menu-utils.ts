import type { PublicMenuCategory, PublicMenuItem } from "@/src/services/public-menu-api";

export const PUBLIC_MENU_MOTION_CAP = 20;

export function categoryCoverImage(category: PublicMenuCategory): string | null {
  const withImage = category.items.find((item) => item.imageUrl);
  return withImage?.imageUrl ?? category.items[0]?.imageUrl ?? null;
}

export function formatMenuItemUnit(
  item: Pick<PublicMenuItem, "unitQuantity" | "unitType">,
): string | null {
  const parts = [item.unitQuantity?.trim(), item.unitType?.trim()].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : null;
}

export function itemMatchesSearch(item: PublicMenuItem, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const haystack = [item.name, item.unitType, item.unitQuantity, item.itemType]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(q);
}

export function motionListIndex(index: number): number {
  return Math.min(index, PUBLIC_MENU_MOTION_CAP);
}

export function motionListDelay(index: number, step = 0.045): number {
  return motionListIndex(index) * step;
}

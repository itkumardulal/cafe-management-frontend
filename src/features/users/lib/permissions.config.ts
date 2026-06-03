import type { AssignableMenu } from "@/src/store/types/user.types";

export const REQUIRED_PERMISSION_CODE = "DASHBOARD";

export type PermissionPresetId = "cashier" | "inventory" | "manager" | "custom";

export const PERMISSION_PRESETS: Array<{
  id: Exclude<PermissionPresetId, "custom">;
  label: string;
  description: string;
  codes: string[];
}> = [
  {
    id: "cashier",
    label: "Cashier",
    description: "Dashboard & POS",
    codes: ["DASHBOARD", "POS", "CUSTOMER_RECEIVABLES"],
  },
  {
    id: "inventory",
    label: "Inventory",
    description: "Stock & suppliers",
    codes: [
      "DASHBOARD",
      "INVENTORY",
      "MENU_ITEMS",
      "RAW_MATERIALS",
      "RAW_MATERIAL_PURCHASES",
      "BILL_SETTLEMENT",
      "STOCK_REMOVALS",
      "SUPPLIERS",
    ],
  },
  {
    id: "manager",
    label: "Full access",
    description: "All assignable areas",
    codes: [],
  },
];

const PERMISSION_GROUPS: Array<{
  id: string;
  label: string;
  description?: string;
  codes: string[];
}> = [
  { id: "overview", label: "Overview", codes: ["DASHBOARD"] },
  {
    id: "menuSales",
    label: "Menu & sales",
    description: "Catalog and point of sale",
    codes: ["MENU_CATEGORIES", "MENU_ITEMS", "TABLES", "POS", "CUSTOMER_RECEIVABLES"],
  },
  {
    id: "inventory",
    label: "Inventory",
    description: "Materials, suppliers, stock",
    codes: [
      "INVENTORY",
      "RAW_MATERIALS",
      "SUPPLIERS",
      "RAW_MATERIAL_PURCHASES",
      "BILL_SETTLEMENT",
      "STOCK_REMOVALS",
      "MENU_ITEMS",
    ],
  },
  {
    id: "finance",
    label: "Finance",
    description: "Expenses and daily costs",
    codes: ["EXPENSE_ITEMS", "DAILY_EXPENSES"],
  },
];

export function ensureRequiredPermission(codes: string[]): string[] {
  const next = new Set(codes);
  next.add(REQUIRED_PERMISSION_CODE);
  return [...next];
}

export function buildGroupedMenus(menus: AssignableMenu[]) {
  const codeToMenu = new Map(menus.map((menu) => [menu.code, menu]));
  const assigned = new Set<string>();
  const groups: Array<{
    id: string;
    label: string;
    description?: string;
    menus: AssignableMenu[];
  }> = [];

  for (const group of PERMISSION_GROUPS) {
    const groupMenus = group.codes
      .map((code) => codeToMenu.get(code))
      .filter((menu): menu is AssignableMenu => Boolean(menu));
    groupMenus.forEach((menu) => assigned.add(menu.code));
    if (groupMenus.length > 0) {
      groups.push({
        id: group.id,
        label: group.label,
        description: group.description,
        menus: groupMenus,
      });
    }
  }

  const otherMenus = menus.filter((menu) => !assigned.has(menu.code));
  if (otherMenus.length > 0) {
    groups.push({ id: "other", label: "Other", menus: otherMenus });
  }

  return groups;
}

export function resolvePresetCodes(
  presetId: Exclude<PermissionPresetId, "custom">,
  assignableMenus: AssignableMenu[],
): string[] {
  const assignable = new Set(assignableMenus.map((menu) => menu.code));

  if (presetId === "manager") {
    return ensureRequiredPermission(assignableMenus.map((menu) => menu.code));
  }

  const preset = PERMISSION_PRESETS.find((item) => item.id === presetId);
  if (!preset) {
    return ensureRequiredPermission([REQUIRED_PERMISSION_CODE]);
  }

  return ensureRequiredPermission(preset.codes.filter((code) => assignable.has(code)));
}

export function detectActivePreset(
  selected: string[],
  assignableMenus: AssignableMenu[],
): PermissionPresetId {
  const normalized = [...selected].sort().join(",");

  for (const preset of PERMISSION_PRESETS) {
    const presetCodes = resolvePresetCodes(preset.id, assignableMenus).sort().join(",");
    if (presetCodes === normalized) {
      return preset.id;
    }
  }

  return "custom";
}

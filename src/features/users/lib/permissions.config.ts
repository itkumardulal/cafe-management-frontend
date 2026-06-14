/** Prefer showing Dashboard first in permission chips when present. */
export const DASHBOARD_PERMISSION_CODE = "DASHBOARD";

export type MenuGroupable = {
  code: string;
  name: string;
};

export type MenuGroup<T extends MenuGroupable> = {
  id: string;
  label: string;
  description?: string;
  menus: T[];
};

const PERMISSION_GROUPS: Array<{
  id: string;
  label: string;
  description?: string;
  codes: string[];
}> = [
  {
    id: "menuSales",
    label: "Menu & sales",
    description: "Catalog setup",
    codes: ["MENU_CATEGORIES", "MENU_ITEMS"],
  },
  {
    id: "pos",
    label: "POS",
    description: "Point of sale and table service",
    codes: ["TABLES", "TABLE_ORDERS", "POS", "INVOICES", "CUSTOMER_RECEIVABLES"],
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
      "DIRECT_PURCHASES",
      "BILL_SETTLEMENT",
      "STOCK_REMOVALS",
    ],
  },
  {
    id: "finance",
    label: "Finance",
    description: "Bank accounts and transactions",
    codes: ["BANKS", "BANK_TRANSACTIONS"],
  },
  {
    id: "expenses",
    label: "Expenses",
    description: "Expense categories and daily entries",
    codes: ["EXPENSE_ITEMS", "DAILY_EXPENSES"],
  },
  {
    id: "reports",
    label: "Reports & dashboard",
    description: "Business analytics and KPI overview (dashboard is optional)",
    codes: ["REPORTS", "DASHBOARD"],
  },
  {
    id: "administration",
    label: "Administration",
    description: "Roles and user management",
    codes: ["ROLES", "USERS"],
  },
  {
    id: "platform",
    label: "Platform",
    description: "Cafe and user oversight",
    codes: ["CAFE_OVERVIEW", "CAFE_ADMINS", "CREATED_USERS"],
  },
];

export function normalizePermissionCodes(codes: string[]): string[] {
  return [...new Set(codes)];
}

export function buildGroupedMenus<T extends MenuGroupable>(menus: T[]): MenuGroup<T>[] {
  const codeToMenu = new Map(menus.map((menu) => [menu.code, menu]));
  const assigned = new Set<string>();
  const groups: MenuGroup<T>[] = [];

  for (const group of PERMISSION_GROUPS) {
    const groupMenus = group.codes
      .map((code) => codeToMenu.get(code))
      .filter((menu): menu is T => Boolean(menu));
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

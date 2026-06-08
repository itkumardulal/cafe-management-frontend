import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  HandCoins,
  Landmark,
  Package,
  Percent,
  TrendingUp,
  Truck,
  Wallet,
} from "lucide-react";

export type ReportCatalogEntry = {
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  icon: LucideIcon;
  category: "Performance" | "Finance" | "Operations";
};

export const REPORT_CATALOG: ReportCatalogEntry[] = [
  {
    slug: "sales",
    title: "Sales report",
    shortTitle: "Sales",
    description: "Revenue, orders, average order value, and top-selling menu items.",
    icon: BarChart3,
    category: "Performance",
  },
  {
    slug: "profit",
    title: "Profit report",
    shortTitle: "Profit",
    description: "Revenue vs cost of goods sold and most profitable menu items.",
    icon: TrendingUp,
    category: "Performance",
  },
  {
    slug: "discounts",
    title: "Discount report",
    shortTitle: "Discounts",
    description: "Discounts given, who applied them, and usage by staff.",
    icon: Percent,
    category: "Performance",
  },
  {
    slug: "expenses",
    title: "Expense report",
    shortTitle: "Expenses",
    description: "Expenses by category compared to sales and profit.",
    icon: Wallet,
    category: "Finance",
  },
  {
    slug: "banks",
    title: "Bank balances",
    shortTitle: "Banks",
    description: "Current bank balances, period deposits and withdrawals, and transaction history.",
    icon: Landmark,
    category: "Finance",
  },
  {
    slug: "inventory",
    title: "Inventory report",
    shortTitle: "Inventory",
    description: "Stock levels, alerts, movement history, and raw material purchases.",
    icon: Package,
    category: "Operations",
  },
  {
    slug: "customer-receivables",
    title: "Customer receivables",
    shortTitle: "Receivables",
    description: "Customers who owe money, unpaid bills, and payment history.",
    icon: HandCoins,
    category: "Finance",
  },
  {
    slug: "supplier-payables",
    title: "Supplier payables",
    shortTitle: "Payables",
    description: "Outstanding supplier bills, overdue amounts, and payments.",
    icon: Truck,
    category: "Finance",
  },
];

export function getReportCatalogEntry(slug: string) {
  return REPORT_CATALOG.find((entry) => entry.slug === slug);
}

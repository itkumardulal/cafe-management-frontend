import {
  Calculator,
  ChartColumn,
  Coffee,
  FolderTree,
  LayoutDashboard,
  LayoutGrid,
  Package,
  PackageMinus,
  ReceiptText,
  Settings,
  ShieldUser,
  ShoppingBag,
  ShoppingCart,
  Store,
  Tags,
  Truck,
  UserRoundSearch,
  Users,
  UtensilsCrossed,
  Wallet,
  Wheat,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  "layout-dashboard": LayoutDashboard,
  "layout-grid": LayoutGrid,
  "receipt-text": ReceiptText,
  package: Package,
  "shopping-bag": ShoppingBag,
  "chart-column": ChartColumn,
  users: Users,
  settings: Settings,
  calculator: Calculator,
  store: Store,
  "shield-user": ShieldUser,
  "user-round-search": UserRoundSearch,
  "folder-tree": FolderTree,
  "utensils-crossed": UtensilsCrossed,
  wheat: Wheat,
  truck: Truck,
  "shopping-cart": ShoppingCart,
  tags: Tags,
  wallet: Wallet,
  "package-minus": PackageMinus,
};

export function getMenuIcon(icon?: string | null): LucideIcon {
  if (!icon) return Coffee;
  return ICON_MAP[icon] ?? Coffee;
}

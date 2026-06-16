"use client";

import Link from "next/link";
import { BarChart3, Package, ShoppingCart, UtensilsCrossed } from "lucide-react";
import { useMemo } from "react";
import { cn } from "@/src/lib/cn";
import { useAppSelector } from "@/src/store/hooks";

const ACTIONS = [
  { code: "POS", href: "/pos", label: "POS", icon: ShoppingCart },
  { code: "REPORTS", href: "/reports", label: "Reports", icon: BarChart3 },
  { code: "TABLE_ORDERS", href: "/table-orders", label: "Table orders", icon: UtensilsCrossed, altCodes: ["TABLES"] },
  { code: "INVENTORY", href: "/inventory", label: "Inventory", icon: Package },
] as const;

export function AnalyticsQuickActions({ className }: { className?: string }) {
  const user = useAppSelector((state) => state.auth.user);
  const menus = useAppSelector((state) => state.menu.items);

  const visibleActions = useMemo(() => {
    if (user?.role === "CAFE_ADMIN") {
      return ACTIONS;
    }
    const codes = new Set(menus.map((m) => m.code));
    return ACTIONS.filter(
      (action) =>
        codes.has(action.code) ||
        ("altCodes" in action && action.altCodes?.some((code) => codes.has(code))),
    );
  }, [menus, user?.role]);

  if (visibleActions.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {visibleActions.map((action) => {
        const Icon = action.icon;
        return (
          <Link
            key={action.href}
            href={action.href}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-[var(--color-cream-50)]"
          >
            <Icon className="h-4 w-4" aria-hidden />
            {action.label}
          </Link>
        );
      })}
    </div>
  );
}

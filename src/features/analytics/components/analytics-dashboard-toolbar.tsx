"use client";

import Link from "next/link";
import { BarChart3, Download, Package, RefreshCw, ShoppingCart, UtensilsCrossed } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/src/components/ui/button";
import { Dropdown } from "@/src/components/ui/dropdown";
import type { AnalyticsOverview } from "@/src/features/analytics/types/analytics.types";
import {
  exportAnalyticsCsv,
  exportAnalyticsExcel,
  exportAnalyticsPdf,
} from "@/src/features/analytics/lib/analytics-export";
import { cn } from "@/src/lib/cn";
import { appToast } from "@/src/lib/toast";
import { useAppSelector } from "@/src/store/hooks";

const ACTIONS = [
  { code: "POS", href: "/pos", label: "POS", mobileLabel: "POS", icon: ShoppingCart },
  { code: "REPORTS", href: "/reports", label: "Reports", mobileLabel: "Reports", icon: BarChart3 },
  {
    code: "TABLE_ORDERS",
    href: "/table-orders",
    label: "Table orders",
    mobileLabel: "Tables",
    icon: UtensilsCrossed,
    altCodes: ["TABLES"],
  },
  { code: "INVENTORY", href: "/inventory", label: "Inventory", mobileLabel: "Inventory", icon: Package },
] as const;

function useVisibleQuickActions() {
  const user = useAppSelector((state) => state.auth.user);
  const menus = useAppSelector((state) => state.menu.items);

  return useMemo(() => {
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
}

function QuickActionLink({
  href,
  label,
  mobileLabel,
  icon: Icon,
  compact,
}: {
  href: string;
  label: string;
  mobileLabel: string;
  icon: LucideIcon;
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] font-medium text-foreground transition-colors",
        "hover:bg-[var(--color-cream-50)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]",
        compact
          ? "min-h-11 w-full min-w-0 justify-center px-2 py-2.5 text-sm"
          : "shrink-0 px-3 py-1.5 text-sm",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      <span className={cn(compact ? "truncate" : undefined)}>{compact ? mobileLabel : label}</span>
    </Link>
  );
}

function ExportControls({
  overview,
  layout,
}: {
  overview: AnalyticsOverview;
  layout: "mobile" | "desktop";
}) {
  if (layout === "mobile") {
    return (
      <div className="min-w-0 flex-1 [&_button]:w-full">
        <Dropdown
          label="Export"
          items={[
            {
              id: "excel",
              label: "Export Excel",
              onClick: () => {
                void exportAnalyticsExcel(overview).catch(() => appToast.error("Export failed"));
              },
            },
            {
              id: "csv",
              label: "Export CSV",
              onClick: () => exportAnalyticsCsv(overview),
            },
            {
              id: "pdf",
              label: "Export PDF",
              onClick: () => {
                void exportAnalyticsPdf(overview).catch(() => appToast.error("Export failed"));
              },
            },
          ]}
        />
      </div>
    );
  }

  return (
    <div className="inline-flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => {
          void exportAnalyticsExcel(overview).catch(() => appToast.error("Export failed"));
        }}
      >
        <Download className="mr-1.5 h-4 w-4" aria-hidden />
        Excel
      </Button>
      <Button type="button" variant="secondary" size="sm" onClick={() => exportAnalyticsCsv(overview)}>
        <Download className="mr-1.5 h-4 w-4" aria-hidden />
        CSV
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => {
          void exportAnalyticsPdf(overview).catch(() => appToast.error("Export failed"));
        }}
      >
        <Download className="mr-1.5 h-4 w-4" aria-hidden />
        PDF
      </Button>
    </div>
  );
}

export function AnalyticsDashboardToolbar({
  overview,
  showExport,
  onRefresh,
}: {
  overview: AnalyticsOverview;
  showExport: boolean;
  onRefresh: () => void;
}) {
  const visibleActions = useVisibleQuickActions();

  if (visibleActions.length === 0 && !showExport) {
    return (
      <Button type="button" variant="secondary" size="sm" onClick={onRefresh}>
        <RefreshCw className="mr-1.5 h-4 w-4" aria-hidden />
        Refresh
      </Button>
    );
  }

  return (
    <>
      {/* Mobile: grouped toolbar card */}
      <div className="surface-card density-compact w-full min-w-0 space-y-3 p-3 md:hidden">
        {visibleActions.length > 0 ? (
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-subtle)]">
              Quick access
            </p>
            <div className="grid w-full min-w-0 grid-cols-2 gap-2 [&>*]:min-w-0">
              {visibleActions.map((action) => (
                <QuickActionLink
                  key={action.href}
                  href={action.href}
                  label={action.label}
                  mobileLabel={action.mobileLabel}
                  icon={action.icon}
                  compact
                />
              ))}
            </div>
          </div>
        ) : null}

        <div
          className={cn(
            "flex items-stretch gap-2",
            visibleActions.length > 0 && "border-t border-[var(--color-border)] pt-3",
          )}
        >
          {showExport ? <ExportControls overview={overview} layout="mobile" /> : null}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onRefresh}
            className={cn(
              "h-11 shrink-0",
              showExport ? "w-11 justify-center px-0" : "min-w-0 flex-1",
            )}
            aria-label="Refresh dashboard"
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
            {!showExport ? <span className="ml-1.5">Refresh</span> : null}
          </Button>
        </div>
      </div>

      {/* Desktop: inline toolbar */}
      <div className="hidden min-w-0 flex-wrap items-center justify-end gap-2 md:flex">
        {visibleActions.map((action) => (
          <QuickActionLink
            key={action.href}
            href={action.href}
            label={action.label}
            mobileLabel={action.mobileLabel}
            icon={action.icon}
          />
        ))}
        {showExport ? <ExportControls overview={overview} layout="desktop" /> : null}
        <Button type="button" variant="secondary" size="sm" onClick={onRefresh}>
          <RefreshCw className="mr-1.5 h-4 w-4" aria-hidden />
          Refresh
        </Button>
      </div>
    </>
  );
}

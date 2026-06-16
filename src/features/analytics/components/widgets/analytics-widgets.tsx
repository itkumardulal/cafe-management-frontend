"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CreditCard,
  HandCoins,
  Package,
  PackageMinus,
  ShoppingCart,
  Truck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import type { AssetsSummary } from "@/src/lib/asset-types";
import { formatMoney } from "@/src/lib/format-display";
import { cn } from "@/src/lib/cn";
import type { AnalyticsOverview, AnalyticsPeriodParams } from "@/src/features/analytics/types/analytics.types";
import {
  activityFeedItemKey,
  dedupeActivityFeedItems,
  mergeActivityFeedItems,
} from "@/src/features/analytics/lib/activity-feed-items";
import { operationsApi } from "@/src/services/operations-api";

function formatEventTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const EVENT_ICONS: Record<string, { icon: LucideIcon; className: string }> = {
  POS_SALE: { icon: ShoppingCart, className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" },
  CUSTOMER_PAYMENT: { icon: CreditCard, className: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300" },
  CUSTOMER_RECEIVABLE_PAYMENT: { icon: HandCoins, className: "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300" },
  RAW_MATERIAL_PURCHASE: { icon: Package, className: "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200" },
  DIRECT_PURCHASE: { icon: Package, className: "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200" },
  RAW_MATERIAL_PURCHASE_PAYMENT: { icon: Truck, className: "bg-orange-50 text-orange-800 dark:bg-orange-950/40 dark:text-orange-200" },
  DIRECT_PURCHASE_PAYMENT: { icon: Truck, className: "bg-orange-50 text-orange-800 dark:bg-orange-950/40 dark:text-orange-200" },
  STOCK_REMOVAL: { icon: PackageMinus, className: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300" },
};

function ActivityEventIcon({ eventType }: { eventType: string }) {
  const config = EVENT_ICONS[eventType] ?? {
    icon: ShoppingCart,
    className: "bg-[var(--color-cream-100)] text-[var(--color-muted)]",
  };
  const Icon = config.icon;
  return (
    <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", config.className)}>
      <Icon className="h-4 w-4" aria-hidden />
    </div>
  );
}

export function StaffTodaySummary({
  data,
}: {
  data: NonNullable<AnalyticsOverview["widgets"]["staffTodaySummary"]>;
}) {
  return (
    <div className="grid w-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 [&>*]:min-w-0">
      <Card density="compact" className="w-full min-w-0 space-y-1 p-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-subtle)]">Today&apos;s sales</p>
        <p className="text-2xl font-semibold tabular-nums">{formatMoney(data.totalSales)}</p>
      </Card>
      <Card density="compact" className="w-full min-w-0 space-y-1 p-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-subtle)]">Today&apos;s orders</p>
        <p className="text-2xl font-semibold tabular-nums">{data.totalOrders}</p>
      </Card>
    </div>
  );
}

export function TableStatusCards({
  data,
  linkToOrders = false,
}: {
  data: NonNullable<AnalyticsOverview["widgets"]["tableStatus"]>;
  linkToOrders?: boolean;
}) {
  const items = [
    { label: "Vacant", value: data.vacant, tone: "text-emerald-600" },
    { label: "Occupied", value: data.occupied, tone: "text-sky-600" },
    { label: "In billing", value: data.inBilling, tone: "text-amber-600" },
  ];

  const content = (
    <div className="grid w-full min-w-0 grid-cols-3 gap-2 sm:gap-3 [&>*]:min-w-0">
      {items.map((item) => (
        <Card key={item.label} density="compact" className="w-full min-w-0 space-y-1 p-2.5 text-center max-md:p-2 sm:p-3">
          <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-subtle)] max-md:leading-tight sm:text-[11px]">
            {item.label}
          </p>
          <p className={`text-xl font-semibold tabular-nums max-md:text-lg sm:text-2xl ${item.tone}`}>{item.value}</p>
        </Card>
      ))}
    </div>
  );

  if (linkToOrders) {
    return (
      <Link href="/table-orders" className="block w-full min-w-0 max-w-full rounded-xl transition-opacity hover:opacity-90">
        {content}
      </Link>
    );
  }

  return content;
}

export function LowStockTable({
  data,
}: {
  data: NonNullable<AnalyticsOverview["widgets"]["lowStock"]>;
}) {
  if (data.items.length === 0) {
    return (
      <Card density="comfortable" className="w-full min-w-0">
        <p className="text-sm text-muted">All tracked stock levels are healthy.</p>
      </Card>
    );
  }

  return (
    <Card density="comfortable" className="w-full min-w-0 max-w-full overflow-hidden p-0">
      <div className="flex items-center justify-between gap-2 border-b border-[var(--color-border)] px-4 py-3">
        <h3 className="min-w-0 text-sm font-semibold text-foreground">Low stock alerts</h3>
        <Link
          href="/inventory?filter=low"
          className="shrink-0 text-xs text-[var(--color-primary)] hover:underline"
        >
          View inventory
        </Link>
      </div>
      <div className="divide-y divide-[var(--color-border)] md:hidden">
        {data.items.map((item) => (
          <div key={`${item.kind}-${item.id}`} className="space-y-1.5 px-4 py-3">
            <div className="flex items-start justify-between gap-2">
              <p className="min-w-0 font-medium text-foreground">{item.name}</p>
              <span
                className={
                  item.stockStatus === "Critical"
                    ? "shrink-0 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-300"
                    : "shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
                }
              >
                {item.stockStatus}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
              <span>
                On hand: <span className="tabular-nums text-foreground">{item.quantityOnHand}</span>
              </span>
              <span>
                Reorder: <span className="tabular-nums text-foreground">{item.reorderLevel}</span>
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-cream-50)]/60 text-left text-xs uppercase tracking-wide text-[var(--color-subtle)]">
              <th className="px-4 py-2 font-medium">Item</th>
              <th className="px-4 py-2 font-medium">On hand</th>
              <th className="px-4 py-2 font-medium">Reorder</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item) => (
              <tr key={`${item.kind}-${item.id}`} className="border-b border-[var(--color-border)] last:border-0">
                <td className="px-4 py-2.5 font-medium text-foreground">{item.name}</td>
                <td className="px-4 py-2.5 tabular-nums text-muted">{item.quantityOnHand}</td>
                <td className="px-4 py-2.5 tabular-nums text-muted">{item.reorderLevel}</td>
                <td className="px-4 py-2.5">
                  <span
                    className={
                      item.stockStatus === "Critical"
                        ? "rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-300"
                        : "rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
                    }
                  >
                    {item.stockStatus}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export function AssetsSummaryWidget({ data }: { data: AssetsSummary }) {
  const items = [
    { label: "Total assets", value: String(data.totalAssets), href: "/assets" },
    { label: "Total asset value", value: formatMoney(data.totalAssetValue), href: "/assets" },
    {
      label: "Under maintenance",
      value: String(data.assetsUnderMaintenance),
      href: "/assets?status=UNDER_MAINTENANCE",
    },
    {
      label: `Warranty expiring (${data.warrantyExpiringWithinDays}d)`,
      value: String(data.warrantyExpiringSoon),
      href: "/asset-reports",
    },
  ];

  return (
    <div className="min-w-0 w-full max-w-full space-y-3">
      <div className="flex min-w-0 items-center justify-between gap-2">
        <h2 className="min-w-0 text-sm font-semibold text-foreground">Assets</h2>
        <Link href="/asset-reports" className="shrink-0 text-xs text-[var(--color-primary)] hover:underline">
          Asset reports
        </Link>
      </div>
      <div className="grid w-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 [&>*]:min-w-0">
        {items.map((item) => (
          <Link key={item.label} href={item.href} className="block w-full min-w-0 max-w-full rounded-xl transition-opacity hover:opacity-90">
            <Card density="compact" className="w-full min-w-0 space-y-1 p-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-subtle)] max-md:line-clamp-2 max-md:leading-snug">
                {item.label}
              </p>
              <p className="text-xl font-semibold tabular-nums max-md:text-lg sm:text-2xl">{item.value}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function ActivityFeedWidget({
  data,
  periodParams,
}: {
  data: AnalyticsOverview["widgets"]["activityFeed"];
  periodParams: AnalyticsPeriodParams;
}) {
  const [items, setItems] = useState(() => dedupeActivityFeedItems(data.items));
  const [cursor, setCursor] = useState(data.nextCursor);
  const [loading, setLoading] = useState(false);

  const periodKey = `${periodParams.period ?? "this_month"}:${periodParams.fromDate ?? ""}:${periodParams.toDate ?? ""}`;

  useEffect(() => {
    setItems(dedupeActivityFeedItems(data.items));
    setCursor(data.nextCursor);
  }, [periodKey, data.items, data.nextCursor]);

  const loadMore = async () => {
    if (!cursor || loading) {
      return;
    }
    setLoading(true);
    try {
      const response = await operationsApi.analytics.activityFeed({
        ...periodParams,
        cursor,
        limit: 20,
      });
      setItems((prev) => mergeActivityFeedItems(prev, response.items));
      setCursor(response.nextCursor);
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <Card density="comfortable" className="w-full min-w-0">
        <p className="text-sm text-muted">No recent activity in this period.</p>
      </Card>
    );
  }

  return (
    <Card density="comfortable" className="w-full min-w-0 max-w-full divide-y divide-[var(--color-border)] p-0">
      <div className="px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">Recent activity</h3>
      </div>
      <ul className="max-h-80 overflow-y-auto">
        {items.map((item) => (
          <li key={activityFeedItemKey(item)} className="px-4 py-3 text-sm">
            <div className="flex gap-3">
              <ActivityEventIcon eventType={item.eventType} />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 font-medium text-foreground">{item.title}</p>
                  <time className="shrink-0 text-xs tabular-nums text-[var(--color-subtle)] md:hidden">
                    {formatEventTime(item.occurredAt)}
                  </time>
                </div>
                <p className="text-xs text-muted">{item.description}</p>
                {item.actorName ? (
                  <p className="mt-0.5 text-xs text-[var(--color-subtle)]">by {item.actorName}</p>
                ) : null}
              </div>
              <time className="hidden shrink-0 pt-1 text-xs tabular-nums text-[var(--color-subtle)] md:block">
                {formatEventTime(item.occurredAt)}
              </time>
            </div>
          </li>
        ))}
      </ul>
      {cursor ? (
        <div className="border-t border-[var(--color-border)] px-4 py-3">
          <Button type="button" variant="secondary" size="sm" onClick={() => void loadMore()} disabled={loading}>
            {loading ? "Loading…" : "Load more"}
          </Button>
        </div>
      ) : null}
    </Card>
  );
}

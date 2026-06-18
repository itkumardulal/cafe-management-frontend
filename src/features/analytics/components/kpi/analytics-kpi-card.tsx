"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Card } from "@/src/components/ui/card";
import { cn } from "@/src/lib/cn";
import type { AnalyticsKpiMetric, AnalyticsLiveKpi, AnalyticsTrend } from "@/src/features/analytics/types/analytics.types";

type AnalyticsKpiCardProps = {
  title: string;
  value: string;
  subtitle?: string;
  trend?: AnalyticsKpiMetric;
  live?: AnalyticsLiveKpi;
  icon: LucideIcon;
  chipClass: string;
  index: number;
  href?: string;
};

function TrendBadge({ trend, changePercent }: { trend: AnalyticsTrend; changePercent: string }) {
  const Icon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const color =
    trend === "up"
      ? "text-emerald-600 dark:text-emerald-400"
      : trend === "down"
        ? "text-red-600 dark:text-red-400"
        : "text-[var(--color-muted)]";

  return (
    <span className={cn("inline-flex min-w-0 max-w-full flex-wrap items-center gap-1 text-xs font-medium", color)}>
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span className="max-md:hidden">{changePercent}% vs previous period</span>
      <span className="md:hidden">{changePercent}% vs prev.</span>
    </span>
  );
}

export function AnalyticsKpiCard({
  title,
  value,
  subtitle,
  trend,
  live,
  icon: Icon,
  chipClass,
  index,
  href,
}: AnalyticsKpiCardProps) {
  const card = (
    <Card
      density="compact"
      className={cn(
        "relative flex h-full min-h-[10.75rem] w-full min-w-0 max-w-full flex-col overflow-hidden p-3 sm:min-h-[11rem] sm:p-3.5",
        href && "transition-shadow hover:ring-2 hover:ring-[var(--color-primary)]/20",
      )}
    >
      <div className="flex min-w-0 shrink-0 items-start justify-between gap-2">
        <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", chipClass)}>
          <Icon className="h-4 w-4" aria-hidden />
        </div>
        {live ? (
          <span className="inline-flex shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
            Live
          </span>
        ) : trend ? (
          <span className="inline-flex shrink-0 rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-900 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-200">
            Period
          </span>
        ) : (
          <span className="inline-flex h-[1.375rem] shrink-0" aria-hidden />
        )}
      </div>
      <div className="mt-2 flex min-h-0 flex-1 flex-col min-w-0">
        <p className="line-clamp-2 text-[11px] font-medium uppercase tracking-wide text-[var(--color-subtle)]">
          {title}
        </p>
        <p className="mt-1 break-words text-xl font-semibold tabular-nums tracking-tight text-foreground">
          {value}
        </p>
        <div className="mt-auto min-h-[2.75rem] space-y-1 pt-2">
          {trend ? <TrendBadge trend={trend.trend} changePercent={trend.changePercent} /> : null}
          {subtitle ? (
            <p className="line-clamp-2 text-xs leading-snug text-[var(--color-muted)]">{subtitle}</p>
          ) : null}
        </div>
      </div>
    </Card>
  );

  return (
    <motion.div
      className="h-full min-w-0 w-full max-w-full"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}
    >
      {href ? (
        <Link
          href={href}
          className="group block h-full w-full min-w-0 max-w-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
        >
          {card}
        </Link>
      ) : (
        card
      )}
    </motion.div>
  );
}

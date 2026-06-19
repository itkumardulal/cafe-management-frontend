"use client";

import type { LucideIcon } from "lucide-react";
import { ChevronLeft, FileBarChart2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/src/components/ui/badge";
import { Card } from "@/src/components/ui/card";
import { cn } from "@/src/lib/cn";
import { getReportCatalogEntry } from "@/src/features/reports/lib/report-catalog";
import { reportHref, type ReportPeriodParams } from "@/src/features/reports/types/reports.types";

const categoryChip: Record<string, string> = {
  Performance: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  Finance: "bg-[var(--color-primary-soft)] text-[var(--color-nav-active-text)]",
  Operations: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
};

export function ReportDetailShell({
  slug,
  title,
  description,
  periodParams,
  periodLabel,
  periodFilter,
  summary,
  children,
  snapshotNote,
  loading,
  relatedReports,
}: {
  slug?: string;
  title: string;
  description: string;
  periodParams?: ReportPeriodParams;
  periodLabel?: string;
  periodFilter?: React.ReactNode;
  summary?: React.ReactNode;
  children: React.ReactNode;
  snapshotNote?: string;
  loading?: boolean;
  relatedReports?: React.ReactNode;
}) {
  const entry = slug ? getReportCatalogEntry(slug) : undefined;
  const Icon: LucideIcon = entry?.icon ?? FileBarChart2;
  const backHref = periodParams ? reportHref("/reports", periodParams) : "/reports";

  return (
    <section className="page-shell page-content space-y-5">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-[var(--color-primary)] transition-colors hover:underline"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Reports
        </Link>
        <span className="text-subtle" aria-hidden>
          /
        </span>
        <span className="font-medium text-foreground">{entry?.shortTitle ?? title}</span>
      </nav>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
              entry?.category
                ? categoryChip[entry.category]
                : "bg-[var(--color-primary-soft)] text-[var(--color-primary)]",
            )}
          >
            <Icon className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="heading-display text-foreground">{title}</h1>
              {entry ? (
                <Badge variant="default" size="sm">
                  {entry.category}
                </Badge>
              ) : null}
              {periodLabel ? (
                <Badge variant="default" size="sm">
                  {periodLabel}
                </Badge>
              ) : snapshotNote ? (
                <Badge variant="warning" size="sm">
                  Live snapshot
                </Badge>
              ) : null}
            </div>
            <p className="max-w-2xl text-muted">{description}</p>
            {snapshotNote ? <p className="text-xs text-muted">{snapshotNote}</p> : null}
          </div>
        </div>
      </div>

      {periodFilter}

      {summary ? <div className="space-y-4">{summary}</div> : null}

      <div className={cn(loading && "opacity-60 transition-opacity")}>{children}</div>

      {!loading && relatedReports ? relatedReports : null}
    </section>
  );
}

export function ReportSummaryStrip({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{children}</div>;
}

type SummaryTone = "neutral" | "positive" | "negative" | "warning" | "info";

const summaryToneStyles: Record<SummaryTone, string> = {
  neutral: "",
  positive:
    "border-emerald-200/70 bg-emerald-50/40 dark:border-emerald-900/40 dark:bg-emerald-950/20",
  negative: "border-red-200/70 bg-red-50/40 dark:border-red-900/40 dark:bg-red-950/20",
  warning: "border tone-warning-panel",
  info: "border-sky-200/70 bg-sky-50/40 dark:border-sky-900/40 dark:bg-sky-950/20",
};

export function ReportSummaryCard({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: SummaryTone;
}) {
  return (
    <Card density="compact" className={cn("space-y-1.5", summaryToneStyles[tone])}>
      <p className="text-xs font-medium uppercase tracking-wide text-subtle">{label}</p>
      <p className="text-xl font-semibold tabular-nums tracking-tight text-foreground">{value}</p>
      {hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </Card>
  );
}

export function ReportSection({
  id,
  title,
  description,
  count,
  children,
  action,
}: {
  id?: string;
  title: string;
  description?: string;
  count?: number;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div id={id} className={id ? "scroll-mt-24 space-y-3" : "space-y-3"}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div>
            <h2 className="text-sm font-semibold text-foreground">{title}</h2>
            {description ? <p className="text-xs text-muted">{description}</p> : null}
          </div>
          {count != null ? (
            <Badge variant="default" size="sm">
              {count} {count === 1 ? "record" : "records"}
            </Badge>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

const agingSeverityStyles = {
  ok: "bg-[var(--color-cream-100)]",
  warn: "tone-warning-surface-subtle",
  danger: "bg-red-50 dark:bg-red-950/30",
};

export function ReportAgingGrid({
  buckets,
}: {
  buckets: Array<{ label: string; value: string; severity?: "ok" | "warn" | "danger" }>;
}) {
  return (
    <Card density="compact" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {buckets.map((bucket) => (
        <div
          key={bucket.label}
          className={cn(
            "rounded-lg px-3 py-2.5",
            agingSeverityStyles[bucket.severity ?? "ok"],
          )}
        >
          <p className="text-xs text-muted">{bucket.label}</p>
          <p
            className={cn(
              "mt-1 font-semibold tabular-nums",
              bucket.severity === "danger"
                ? "text-red-700 dark:text-red-400"
                : bucket.severity === "warn"
                  ? "tone-warning-text"
                  : "text-foreground",
            )}
          >
            {bucket.value}
          </p>
        </div>
      ))}
    </Card>
  );
}

export function ReportTabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: Array<{ id: T; label: string; count?: number }>;
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div
      className="flex gap-1 overflow-x-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-cream-100)] p-1"
      role="tablist"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          className={cn(
            "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            active === tab.id
              ? "bg-[var(--color-surface)] text-foreground shadow-sm"
              : "text-muted hover:text-foreground",
          )}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
          {tab.count != null ? (
            <span className="rounded-full bg-[var(--color-cream-200)] px-1.5 py-0.5 text-[11px] tabular-nums">
              {tab.count}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

export function ReportInsightCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card
      density="compact"
      className="border-[var(--color-primary)]/20 bg-[var(--color-primary-soft)]/40"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">
        {title}
      </p>
      <div className="mt-2 text-sm leading-relaxed text-foreground">{children}</div>
    </Card>
  );
}

export function buildAgingBuckets(
  aging: {
    current: number;
    days1_30: number;
    days31_60: number;
    days61_90: number;
    days90Plus: number;
  },
  formatValue: (amount: number) => string,
) {
  return [
    { label: "Current", value: formatValue(aging.current), severity: "ok" as const },
    { label: "1–30 days", value: formatValue(aging.days1_30), severity: "ok" as const },
    { label: "31–60 days", value: formatValue(aging.days31_60), severity: "warn" as const },
    { label: "61–90 days", value: formatValue(aging.days61_90), severity: "warn" as const },
    { label: "90+ days", value: formatValue(aging.days90Plus), severity: "danger" as const },
  ];
}

"use client";

import type { ReactNode } from "react";
import { Suspense } from "react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { ReportPeriodFilter } from "@/src/features/reports/components/report-period-filter";
import { ReportDetailShell } from "@/src/features/reports/components/report-detail-shell";
import { ReportDetailSkeleton } from "@/src/features/reports/components/reports-skeleton";
import { useReportPeriodNavigation } from "@/src/features/reports/components/reports-hub-content";
import { getReportCatalogEntry, REPORT_CATALOG } from "@/src/features/reports/lib/report-catalog";
import { reportHref, type ReportPeriodParams } from "@/src/features/reports/types/reports.types";

type ReportPageLayoutProps = {
  slug: string;
  periodLabel?: string;
  snapshotNote?: string;
  loading?: boolean;
  showPeriodFilter?: boolean;
  periodParams?: ReportPeriodParams;
  onPeriodChange?: (params: ReportPeriodParams) => void;
  summary?: ReactNode;
  children: ReactNode;
  skeletonColumns?: number;
};

export function ReportPageLayout({
  slug,
  periodLabel,
  snapshotNote,
  loading,
  showPeriodFilter = true,
  periodParams,
  onPeriodChange,
  summary,
  children,
  skeletonColumns = 4,
}: ReportPageLayoutProps) {
  const entry = getReportCatalogEntry(slug);
  const title = entry?.title ?? "Report";
  const description = entry?.description ?? "";

  return (
    <ReportDetailShell
      slug={slug}
      title={title}
      description={description}
      periodParams={periodParams}
      periodLabel={periodLabel}
      snapshotNote={snapshotNote}
      loading={loading}
      periodFilter={
        showPeriodFilter && periodParams && onPeriodChange ? (
          <ReportPeriodFilter period={periodParams} onPeriodChange={onPeriodChange} compact />
        ) : null
      }
      summary={summary}
      relatedReports={
        entry ? (
          <ReportRelatedLinks slug={slug} periodParams={periodParams} category={entry.category} />
        ) : null
      }
    >
      {children}
    </ReportDetailShell>
  );
}

function ReportRelatedLinks({
  slug,
  periodParams,
  category,
}: {
  slug: string;
  periodParams?: ReportPeriodParams;
  category: string;
}) {
  const related = REPORT_CATALOG.filter((e) => e.category === category && e.slug !== slug).slice(
    0,
    3,
  );
  if (related.length === 0) return null;

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-cream-50)] px-4 py-3 dark:bg-[var(--color-cream-100)]/30">
      <p className="text-xs font-medium uppercase tracking-wide text-subtle">Related reports</p>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {related.map((entry) => {
          const Icon = entry.icon;
          const href = reportHref(`/reports/${entry.slug}`, periodParams);
          return (
            <Link
              key={entry.slug}
              href={href}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-primary)] transition-colors hover:underline"
            >
              <Icon className="h-3.5 w-3.5" aria-hidden />
              {entry.shortTitle}
              <ArrowRight className="h-3 w-3 opacity-60" aria-hidden />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function ReportPageWithPeriod({
  slug,
  skeletonColumns,
  children,
}: {
  slug: string;
  skeletonColumns?: number;
  children: (ctx: {
    periodParams: ReportPeriodParams;
    setPeriodParams: (params: ReportPeriodParams) => void;
  }) => ReactNode;
}) {
  return (
    <Suspense fallback={<ReportDetailSkeleton columns={skeletonColumns} />}>
      <ReportPageWithPeriodContent slug={slug} skeletonColumns={skeletonColumns}>
        {children}
      </ReportPageWithPeriodContent>
    </Suspense>
  );
}

function ReportPageWithPeriodContent({
  slug,
  skeletonColumns,
  children,
}: {
  slug: string;
  skeletonColumns?: number;
  children: (ctx: {
    periodParams: ReportPeriodParams;
    setPeriodParams: (params: ReportPeriodParams) => void;
  }) => ReactNode;
}) {
  const { periodParams, setPeriodParams } = useReportPeriodNavigation();
  return <>{children({ periodParams, setPeriodParams })}</>;
}

export function ReportSnapshotPage({
  slug,
  skeletonColumns,
  children,
}: {
  slug: string;
  skeletonColumns?: number;
  children: ReactNode;
}) {
  return (
    <Suspense fallback={<ReportDetailSkeleton columns={skeletonColumns} />}>
      {children}
    </Suspense>
  );
}

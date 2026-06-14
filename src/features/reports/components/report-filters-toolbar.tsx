"use client";

import { CalendarRange } from "lucide-react";
import type { ReactNode } from "react";
import { Card } from "@/src/components/ui/card";
import { ReportPeriodFilter } from "@/src/features/reports/components/report-period-filter";
import type { ReportPeriodParams } from "@/src/features/reports/types/reports.types";
import { cn } from "@/src/lib/cn";

type ReportFiltersToolbarProps = {
  period: ReportPeriodParams;
  onPeriodChange: (params: ReportPeriodParams) => void;
  secondaryFilters?: ReactNode;
  className?: string;
};

export function ReportFilterSectionLabel({
  icon: Icon,
  children,
  htmlFor,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5 shrink-0 text-[var(--color-primary)]" aria-hidden />
      {htmlFor ? (
        <label
          htmlFor={htmlFor}
          className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-subtle)]"
        >
          {children}
        </label>
      ) : (
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-subtle)]">
          {children}
        </span>
      )}
    </div>
  );
}

export function ReportFiltersToolbar({
  period,
  onPeriodChange,
  secondaryFilters,
  className,
}: ReportFiltersToolbarProps) {
  return (
    <Card
      density="compact"
      className={cn(
        "overflow-hidden border-[var(--color-border)] bg-[var(--color-cream-50)]/40 p-4 dark:bg-[var(--color-cream-100)]/20",
        className,
      )}
    >
      <div
        className={cn(
          "grid gap-4",
          secondaryFilters
            ? "lg:grid-cols-[minmax(0,1fr)_auto_minmax(13.5rem,16rem)] lg:items-end lg:gap-5"
            : "grid-cols-1",
        )}
      >
        <div className="min-w-0 space-y-2">
          <ReportFilterSectionLabel icon={CalendarRange}>Reporting period</ReportFilterSectionLabel>
          <ReportPeriodFilter period={period} onPeriodChange={onPeriodChange} compact />
        </div>

        {secondaryFilters ? (
          <>
            <div
              className="hidden lg:block w-px self-stretch bg-[var(--color-border)]"
              aria-hidden
            />
            <div className="min-w-0 border-t border-[var(--color-border)] pt-4 lg:border-t-0 lg:pt-0">
              {secondaryFilters}
            </div>
          </>
        ) : null}
      </div>
    </Card>
  );
}

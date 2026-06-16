"use client";

import { CalendarRange } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { DatePicker } from "@/src/components/ui/date-picker";
import { Field } from "@/src/components/ui/field";
import { Select } from "@/src/components/ui/select";
import { cn } from "@/src/lib/cn";
import { appToast } from "@/src/lib/toast";
import type { ReportPeriodKey, ReportPeriodParams } from "@/src/features/reports/types/reports.types";
import {
  defaultCustomReportRange,
  isReportPeriodReady,
} from "@/src/features/reports/types/reports.types";

const PERIOD_OPTIONS: Array<{ key: ReportPeriodKey; label: string }> = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "last_7_days", label: "Last 7 days" },
  { key: "last_30_days", label: "Last 30 days" },
  { key: "this_month", label: "This month" },
  { key: "last_month", label: "Last month" },
  { key: "custom", label: "Custom" },
];

export function parsePeriodFromSearchParams(
  searchParams: URLSearchParams,
): ReportPeriodParams {
  const period = (searchParams.get("period") as ReportPeriodKey | null) ?? "this_month";
  const fromDate = searchParams.get("fromDate") ?? undefined;
  const toDate = searchParams.get("toDate") ?? undefined;
  return { period, fromDate, toDate };
}

function periodLabel(params: ReportPeriodParams): string {
  if (params.period === "custom" && params.fromDate && params.toDate) {
    return `${params.fromDate} – ${params.toDate}`;
  }
  return PERIOD_OPTIONS.find((opt) => opt.key === (params.period ?? "this_month"))?.label ?? "This month";
}

type ReportPeriodFilterProps = {
  period: ReportPeriodParams;
  onPeriodChange: (params: ReportPeriodParams) => void;
  className?: string;
  compact?: boolean;
  showSnapshotHint?: boolean;
};

function ReportCustomDateRange({
  fromDate,
  toDate,
  onFromChange,
  onToChange,
  onApply,
  idPrefix,
}: {
  fromDate: string;
  toDate: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onApply: () => void;
  idPrefix: string;
}) {
  return (
    <div
      className={cn(
        "flex w-full min-w-0 flex-col gap-2 rounded-xl border border-[var(--color-border)]",
        "bg-[var(--color-cream-50)]/60 p-2.5 md:flex-row md:flex-wrap md:items-center md:gap-x-2 md:gap-y-2 md:p-1.5",
      )}
      role="group"
      aria-label="Custom date range"
    >
      <div className="flex w-full min-w-0 items-center gap-1.5 md:min-w-[9.5rem] md:max-w-[11.5rem] md:flex-1">
        <label
          htmlFor={`${idPrefix}-from`}
          className="w-9 shrink-0 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-subtle)]"
        >
          From
        </label>
        <DatePicker
          id={`${idPrefix}-from`}
          value={fromDate}
          onChange={onFromChange}
          max={toDate || undefined}
          showIcon={false}
          placeholder="Start"
          aria-label="From date"
          className="min-w-0 flex-1"
        />
      </div>

      <span className="hidden shrink-0 px-0.5 text-sm text-[var(--color-subtle)] md:inline" aria-hidden>
        —
      </span>

      <div className="flex w-full min-w-0 items-center gap-1.5 md:min-w-[9.5rem] md:max-w-[11.5rem] md:flex-1">
        <label
          htmlFor={`${idPrefix}-to`}
          className="w-9 shrink-0 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-subtle)]"
        >
          To
        </label>
        <DatePicker
          id={`${idPrefix}-to`}
          value={toDate}
          onChange={onToChange}
          min={fromDate || undefined}
          showIcon={false}
          placeholder="End"
          aria-label="To date"
          className="min-w-0 flex-1"
        />
      </div>

      <Button
        type="button"
        variant="brand"
        size="sm"
        onClick={onApply}
        className="h-9 w-full shrink-0 px-4 md:ml-0.5 md:w-auto"
      >
        Apply
      </Button>
    </div>
  );
}

export function ReportPeriodFilter({
  period,
  onPeriodChange,
  className,
  compact = false,
  showSnapshotHint = false,
}: ReportPeriodFilterProps) {
  const [customFrom, setCustomFrom] = useState(period.fromDate ?? "");
  const [customTo, setCustomTo] = useState(period.toDate ?? "");
  const [customDraft, setCustomDraft] = useState(
    period.period === "custom" && !isReportPeriodReady(period),
  );

  useEffect(() => {
    const fallback = defaultCustomReportRange();
    setCustomFrom(period.fromDate ?? fallback.fromDate);
    setCustomTo(period.toDate ?? fallback.toDate);
    setCustomDraft(period.period === "custom" && !isReportPeriodReady(period));
  }, [period.period, period.fromDate, period.toDate]);

  const activeTab: ReportPeriodKey =
    customDraft || period.period === "custom" ? "custom" : (period.period ?? "this_month");

  const applyCustomRange = useCallback(() => {
    if (!customFrom.trim() || !customTo.trim()) {
      appToast.error("Select both start and end dates");
      return;
    }
    if (customFrom > customTo) {
      appToast.error("Start date must be on or before end date");
      return;
    }
    setCustomDraft(false);
    onPeriodChange({ period: "custom", fromDate: customFrom, toDate: customTo });
  }, [customFrom, customTo, onPeriodChange]);

  const handlePeriodSelect = useCallback(
    (key: ReportPeriodKey) => {
      if (key === "custom") {
        setCustomDraft(true);
        if (!customFrom || !customTo) {
          const next = defaultCustomReportRange();
          setCustomFrom(next.fromDate);
          setCustomTo(next.toDate);
        }
        return;
      }
      setCustomDraft(false);
      onPeriodChange({ period: key });
    },
    [customFrom, customTo, onPeriodChange],
  );

  const segmented = (
    <div
      className="hidden w-full min-w-0 gap-0.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-cream-100)] p-1 shadow-sm md:inline-flex md:flex-wrap"
      role="tablist"
      aria-label="Report period"
    >
      {PERIOD_OPTIONS.map((opt) => (
        <button
          key={opt.key}
          type="button"
          role="tab"
          aria-selected={activeTab === opt.key}
          className={cn(
            "shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
            activeTab === opt.key
              ? "bg-[var(--color-surface)] text-[var(--color-foreground)] shadow-sm ring-1 ring-[var(--color-border)]"
              : "text-[var(--color-muted)] hover:bg-[var(--color-surface)]/60 hover:text-[var(--color-foreground)]",
          )}
          onClick={() => handlePeriodSelect(opt.key)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );

  const mobilePeriodSelect = (
    <div className="w-full min-w-0 md:hidden">
      <Field id="report-period-mobile" label="Reporting period" className="min-w-0">
        <Select
          id="report-period-mobile"
          fullWidth
          value={activeTab}
          onChange={(event) => handlePeriodSelect(event.target.value as ReportPeriodKey)}
        >
          {PERIOD_OPTIONS.map((opt) => (
            <option key={opt.key} value={opt.key}>
              {opt.label}
            </option>
          ))}
        </Select>
      </Field>
    </div>
  );

  const customRange = activeTab === "custom" ? (
    <ReportCustomDateRange
      idPrefix={compact ? "report-compact" : "report-hub"}
      fromDate={customFrom}
      toDate={customTo}
      onFromChange={setCustomFrom}
      onToChange={setCustomTo}
      onApply={applyCustomRange}
    />
  ) : null;

  const periodControls = (
    <div
      className={cn(
        "flex min-w-0 w-full max-w-full flex-col gap-2.5 lg:flex-row lg:flex-wrap lg:items-center",
        activeTab === "custom" && "lg:gap-2",
      )}
    >
      {mobilePeriodSelect}
      {segmented}
      {customRange}
    </div>
  );

  if (compact) {
    return <div className={cn("min-w-0 w-full max-w-full space-y-0", className)}>{periodControls}</div>;
  }

  return (
    <Card density="compact" className={cn("space-y-3", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-primary-soft)]">
            <CalendarRange className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Reporting period</p>
            <p className="text-xs text-muted">
              {customDraft ? "Pick dates, then apply" : periodLabel(period)}
            </p>
          </div>
        </div>
        <span className="inline-flex shrink-0 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-0.5 text-[11px] font-semibold text-foreground">
          {activeTab === "custom" ? "Custom range" : "Preset"}
        </span>
      </div>

      {periodControls}

      {showSnapshotHint ? (
        <p className="text-xs text-muted">
          Live balances below are current as of today and are not filtered by this period.
        </p>
      ) : null}
    </Card>
  );
}

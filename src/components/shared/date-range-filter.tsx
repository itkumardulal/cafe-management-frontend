"use client";

import { CalendarRange } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { DatePicker } from "@/src/components/ui/date-picker";
import { cn } from "@/src/lib/cn";

function InlineDateField({
  id,
  label,
  value,
  onChange,
  min,
  max,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
}) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <label
        htmlFor={id}
        className="w-9 shrink-0 text-xs font-medium text-[var(--color-muted)] sm:w-10"
      >
        {label}
      </label>
      <DatePicker
        id={id}
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        showIcon={false}
        placeholder="Select date"
        aria-label={`${label} date`}
        className="min-w-0 flex-1"
      />
    </div>
  );
}

export function DateRangeFilter({
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  onApply,
  title = "Date range",
  description = "Filter entries by date.",
  fromLabel = "From",
  toLabel = "To",
  compact = false,
}: {
  fromDate: string;
  toDate: string;
  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;
  onApply: () => void;
  title?: string;
  description?: string;
  fromLabel?: string;
  toLabel?: string;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <CalendarRange size={16} strokeWidth={1.75} className="text-[var(--color-primary)]" aria-hidden />
          <p className="text-sm font-medium text-[var(--color-foreground)]">{title}</p>
        </div>
        <div className="space-y-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-cream-50)]/40 p-3">
          <InlineDateField
            id="fromDate"
            label={fromLabel}
            value={fromDate}
            onChange={onFromDateChange}
            max={toDate || undefined}
          />
          <InlineDateField
            id="toDate"
            label={toLabel}
            value={toDate}
            onChange={onToDateChange}
            min={fromDate || undefined}
          />
        </div>
      </div>
    );
  }

  return (
    <section
      aria-label={title}
      className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)]/50 p-3 sm:p-3.5"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-5">
        <div className="flex min-w-0 shrink-0 items-start gap-2.5 lg:w-[11.5rem]">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
            <CalendarRange size={16} strokeWidth={1.75} aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold leading-tight text-[var(--color-foreground)]">{title}</h2>
            <p className="mt-0.5 hidden text-xs leading-snug text-muted sm:block">{description}</p>
          </div>
        </div>

        <div
          className={cn(
            "flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-2",
          )}
        >
          <InlineDateField
            id="fromDate"
            label={fromLabel}
            value={fromDate}
            onChange={onFromDateChange}
            max={toDate || undefined}
          />
          <span
            className="hidden shrink-0 px-0.5 text-sm text-[var(--color-subtle)] sm:inline"
            aria-hidden
          >
            —
          </span>
          <InlineDateField
            id="toDate"
            label={toLabel}
            value={toDate}
            onChange={onToDateChange}
            min={fromDate || undefined}
          />
          <Button
            type="button"
            variant="brand"
            onClick={onApply}
            className="h-10 w-full shrink-0 px-5 sm:ml-auto sm:w-auto"
          >
            Apply filter
          </Button>
        </div>
      </div>
    </section>
  );
}

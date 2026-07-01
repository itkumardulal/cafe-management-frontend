/** ISO date string helpers (YYYY-MM-DD, app business timezone). */

import { addDaysToIsoDate, formatIsoDateInTimeZone } from "@/src/lib/app-timezone";

export function parseIsoDate(value: string | undefined | null): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  const d = new Date(`${value}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayIsoDate(): string {
  return formatIsoDateInTimeZone(new Date());
}

export function isIsoBefore(a: string, b: string): boolean {
  return a < b;
}

export function isIsoAfter(a: string, b: string): boolean {
  return a > b;
}

export type CalendarCell = {
  iso: string;
  date: Date;
  inMonth: boolean;
};

export function getCalendarCells(viewYear: number, viewMonth: number): CalendarCell[] {
  const first = new Date(viewYear, viewMonth, 1);
  const startOffset = first.getDay();
  const gridStart = new Date(viewYear, viewMonth, 1 - startOffset);

  return Array.from({ length: 42 }, (_, i) => {
    const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
    return {
      date,
      iso: toIsoDate(date),
      inMonth: date.getMonth() === viewMonth,
    };
  });
}

export function monthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

export function monthName(month: number, style: "long" | "short" = "long"): string {
  return new Date(2000, month, 1).toLocaleDateString(undefined, { month: style });
}

export const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;

export const MONTH_INDEXES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;

const DEFAULT_YEAR_SPAN = 12;

export function getYearPageStart(year: number): number {
  return Math.floor(year / DEFAULT_YEAR_SPAN) * DEFAULT_YEAR_SPAN;
}

export function getYearPageYears(pageStart: number): number[] {
  return Array.from({ length: DEFAULT_YEAR_SPAN }, (_, i) => pageStart + i);
}

export function getYearBounds(min?: string, max?: string): { minYear: number; maxYear: number } {
  const currentYear = new Date().getFullYear();
  const minYear = min ? (parseIsoDate(min)?.getFullYear() ?? currentYear - 50) : currentYear - 50;
  const maxYear = max ? (parseIsoDate(max)?.getFullYear() ?? currentYear + 10) : currentYear + 10;
  return { minYear, maxYear };
}

export function isMonthDisabled(year: number, month: number, min?: string, max?: string): boolean {
  if (!min && !max) return false;
  const firstDay = toIsoDate(new Date(year, month, 1));
  const lastDay = toIsoDate(new Date(year, month + 1, 0));
  if (min && isIsoBefore(lastDay, min)) return true;
  if (max && isIsoAfter(firstDay, max)) return true;
  return false;
}

export function isYearDisabled(year: number, min?: string, max?: string): boolean {
  const { minYear, maxYear } = getYearBounds(min, max);
  return year < minYear || year > maxYear;
}

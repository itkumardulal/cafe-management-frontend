"use client";

import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/src/lib/cn";
import {
  getCalendarCells,
  getYearBounds,
  getYearPageStart,
  getYearPageYears,
  isIsoAfter,
  isIsoBefore,
  isMonthDisabled,
  isYearDisabled,
  monthLabel,
  monthName,
  MONTH_INDEXES,
  parseIsoDate,
  todayIsoDate,
  WEEKDAY_LABELS,
} from "@/src/lib/date-picker-utils";
import { formatDateOnly } from "@/src/lib/format-display";

type PanelView = "days" | "months" | "years";

type DatePickerProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  min?: string;
  max?: string;
  disabled?: boolean;
  className?: string;
  showIcon?: boolean;
  "aria-label"?: string;
};

const POPOVER_WIDTH = 300;

export function DatePicker({
  id,
  value,
  onChange,
  placeholder = "Select date",
  min,
  max,
  disabled = false,
  className,
  showIcon = true,
  "aria-label": ariaLabel,
}: DatePickerProps) {
  const fallbackId = useId();
  const triggerId = id ?? fallbackId;
  const popoverId = `${triggerId}-calendar`;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const wasOpenRef = useRef(false);

  const selected = parseIsoDate(value);
  const todayIso = todayIsoDate();

  const [open, setOpen] = useState(false);
  const [panelView, setPanelView] = useState<PanelView>("days");
  const [viewYear, setViewYear] = useState(() => (selected ?? new Date()).getFullYear());
  const [viewMonth, setViewMonth] = useState(() => (selected ?? new Date()).getMonth());
  const [yearPageStart, setYearPageStart] = useState(() =>
    getYearPageStart((selected ?? new Date()).getFullYear()),
  );
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const updatePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const padding = 8;
    let left = rect.left;
    if (left + POPOVER_WIDTH > window.innerWidth - padding) {
      left = window.innerWidth - POPOVER_WIDTH - padding;
    }
    left = Math.max(padding, left);

    const popoverHeight = panelView === "days" ? 360 : 280;
    const spaceBelow = window.innerHeight - rect.bottom;
    const top =
      spaceBelow >= popoverHeight + padding
        ? rect.bottom + 6
        : Math.max(padding, rect.top - popoverHeight - 6);

    setPosition({ top, left });
  }, [panelView]);

  // Reset calendar only when the popover opens — not when panelView changes.
  useEffect(() => {
    if (open && !wasOpenRef.current) {
      const parsed = parseIsoDate(value) ?? new Date();
      setViewYear(parsed.getFullYear());
      setViewMonth(parsed.getMonth());
      setYearPageStart(getYearPageStart(parsed.getFullYear()));
      setPanelView("days");
    }
    wasOpenRef.current = open;
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open, panelView, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const onScrollOrResize = () => updatePosition();
    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("scroll", onScrollOrResize, true);
    return () => {
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("scroll", onScrollOrResize, true);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || popoverRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (panelView !== "days") {
          setPanelView("days");
          return;
        }
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, panelView]);

  const isDisabledDay = (iso: string) => {
    if (min && isIsoBefore(iso, min)) return true;
    if (max && isIsoAfter(iso, max)) return true;
    return false;
  };

  const goMonth = (delta: number) => {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  const goYearPage = (delta: number) => {
    setYearPageStart((start) => start + delta * 12);
  };

  const selectDay = (iso: string) => {
    if (isDisabledDay(iso)) return;
    onChange(iso);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const selectMonth = (month: number) => {
    if (isMonthDisabled(viewYear, month, min, max)) return;
    setViewMonth(month);
    setPanelView("days");
  };

  const selectYear = (year: number) => {
    if (isYearDisabled(year, min, max)) return;
    setViewYear(year);
    setPanelView("months");
  };

  const handleTriggerKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen((o) => !o);
    }
    if (event.key === "ArrowDown" && !open) {
      event.preventDefault();
      setOpen(true);
    }
  };

  const headerNav = () => {
    if (panelView === "years") {
      const years = getYearPageYears(yearPageStart);
      const { minYear, maxYear } = getYearBounds(min, max);
      const canPrev = years[0] > minYear;
      const canNext = years[years.length - 1] < maxYear;
      return {
        label: `${years[0]} – ${years[years.length - 1]}`,
        onPrev: canPrev ? () => goYearPage(-1) : undefined,
        onNext: canNext ? () => goYearPage(1) : undefined,
      };
    }
    if (panelView === "months") {
      return {
        label: String(viewYear),
        onPrev: !isYearDisabled(viewYear - 1, min, max) ? () => setViewYear((y) => y - 1) : undefined,
        onNext: !isYearDisabled(viewYear + 1, min, max) ? () => setViewYear((y) => y + 1) : undefined,
      };
    }
    return {
      label: null,
      onPrev: () => goMonth(-1),
      onNext: () => goMonth(1),
    };
  };

  const nav = headerNav();
  const cells = getCalendarCells(viewYear, viewMonth);
  const yearOptions = getYearPageYears(yearPageStart);

  const pickerPanel = (
    <div
      ref={popoverRef}
      id={popoverId}
      role="dialog"
      aria-modal="false"
      aria-label="Choose date"
      style={{
        position: "fixed",
        top: position.top,
        left: position.left,
        width: POPOVER_WIDTH,
        zIndex: 60,
      }}
      className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-lg)]"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-1 border-b border-[var(--color-border)] px-2 py-2">
        <button
          type="button"
          disabled={!nav.onPrev}
          className="icon-button-square shrink-0 text-[var(--color-muted)] hover:bg-[var(--color-cream-100)] hover:text-[var(--color-foreground)] disabled:pointer-events-none disabled:opacity-35"
          onClick={nav.onPrev}
          aria-label={
            panelView === "years" ? "Previous years" : panelView === "months" ? "Previous year" : "Previous month"
          }
        >
          <ChevronLeft size={18} strokeWidth={1.75} aria-hidden />
        </button>

        <div className="flex min-w-0 flex-1 items-center justify-center gap-1">
          {panelView === "days" ? (
            <>
              <button
                type="button"
                className="inline-flex items-center gap-0.5 rounded-md px-2 py-1.5 text-sm font-semibold text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-cream-100)]"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setPanelView("months")}
                aria-label="Choose month"
              >
                {monthName(viewMonth, "long")}
                <ChevronDown size={14} className="text-[var(--color-muted)]" aria-hidden />
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-0.5 rounded-md px-2 py-1.5 text-sm font-semibold tabular-nums text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-cream-100)]"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setYearPageStart(getYearPageStart(viewYear));
                  setPanelView("years");
                }}
                aria-label="Choose year"
              >
                {viewYear}
                <ChevronDown size={14} className="text-[var(--color-muted)]" aria-hidden />
              </button>
            </>
          ) : (
            <p className="truncate px-1 text-sm font-semibold tabular-nums text-[var(--color-foreground)]">
              {panelView === "months" ? String(viewYear) : nav.label}
            </p>
          )}
        </div>

        <button
          type="button"
          disabled={!nav.onNext}
          className="icon-button-square shrink-0 text-[var(--color-muted)] hover:bg-[var(--color-cream-100)] hover:text-[var(--color-foreground)] disabled:pointer-events-none disabled:opacity-35"
          onClick={nav.onNext}
          aria-label={
            panelView === "years" ? "Next years" : panelView === "months" ? "Next year" : "Next month"
          }
        >
          <ChevronRight size={18} strokeWidth={1.75} aria-hidden />
        </button>
      </div>

      {panelView === "days" ? (
        <div className="p-3">
          <div className="mb-1 grid grid-cols-7 gap-0.5">
            {WEEKDAY_LABELS.map((day) => (
              <div
                key={day}
                className="py-1 text-center text-[11px] font-medium uppercase tracking-wide text-[var(--color-subtle)]"
              >
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5" role="grid" aria-label={`${monthLabel(viewYear, viewMonth)} calendar`}>
            {cells.map((cell) => {
              const isSelected = value === cell.iso;
              const isToday = cell.iso === todayIso;
              const dayDisabled = isDisabledDay(cell.iso);

              return (
                <button
                  key={cell.iso}
                  type="button"
                  role="gridcell"
                  disabled={dayDisabled}
                  aria-selected={isSelected}
                  aria-label={formatDateOnly(cell.iso)}
                  onClick={() => selectDay(cell.iso)}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg text-sm transition-colors",
                    !cell.inMonth && "text-[var(--color-subtle)]/55",
                    cell.inMonth && !isSelected && "text-[var(--color-foreground)]",
                    cell.inMonth && !isSelected && !dayDisabled && "hover:bg-[var(--color-cream-100)]",
                    isToday && !isSelected && "font-semibold text-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/30 ring-inset",
                    isSelected && "bg-[var(--color-primary)] font-semibold text-[var(--color-primary-foreground)] shadow-sm",
                    dayDisabled && "cursor-not-allowed opacity-30 hover:bg-transparent",
                  )}
                >
                  {cell.date.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {panelView === "months" ? (
        <div className="grid grid-cols-3 gap-1.5 p-3" role="listbox" aria-label="Choose month">
          {MONTH_INDEXES.map((month) => {
            const monthDisabled = isMonthDisabled(viewYear, month, min, max);
            const isActive = viewMonth === month;
            return (
              <button
                key={month}
                type="button"
                role="option"
                aria-selected={isActive}
                disabled={monthDisabled}
                onClick={() => selectMonth(month)}
                className={cn(
                  "rounded-lg px-2 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-sm"
                    : "text-[var(--color-foreground)] hover:bg-[var(--color-cream-100)]",
                  monthDisabled && "cursor-not-allowed opacity-30 hover:bg-transparent",
                )}
              >
                {monthName(month, "short")}
              </button>
            );
          })}
        </div>
      ) : null}

      {panelView === "years" ? (
        <div className="grid grid-cols-3 gap-1.5 p-3" role="listbox" aria-label="Choose year">
          {yearOptions.map((year) => {
            const yearDisabled = isYearDisabled(year, min, max);
            const isActive = viewYear === year;
            return (
              <button
                key={year}
                type="button"
                role="option"
                aria-selected={isActive}
                disabled={yearDisabled}
                onClick={() => selectYear(year)}
                className={cn(
                  "rounded-lg px-2 py-2.5 text-sm font-medium tabular-nums transition-colors",
                  isActive
                    ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-sm"
                    : "text-[var(--color-foreground)] hover:bg-[var(--color-cream-100)]",
                  yearDisabled && "cursor-not-allowed opacity-30 hover:bg-transparent",
                )}
              >
                {year}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="flex items-center justify-between border-t border-[var(--color-border)] bg-[var(--color-surface-muted)]/30 px-3 py-2">
        {panelView !== "days" ? (
          <button
            type="button"
            className="rounded-md px-2 py-1.5 text-xs font-medium text-[var(--color-muted)] transition-colors hover:bg-[var(--color-cream-100)] hover:text-[var(--color-foreground)]"
            onClick={() => setPanelView("days")}
          >
            Back to days
          </button>
        ) : (
          <button
            type="button"
            className="rounded-md px-2 py-1.5 text-xs font-medium text-[var(--color-muted)] transition-colors hover:bg-[var(--color-cream-100)] hover:text-[var(--color-foreground)]"
            onClick={() => {
              onChange("");
              setOpen(false);
              triggerRef.current?.focus();
            }}
          >
            Clear
          </button>
        )}
        <button
          type="button"
          className="rounded-md px-2 py-1.5 text-xs font-medium text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary-soft)]"
          onClick={() => {
            if (panelView !== "days") {
              const parsed = parseIsoDate(todayIso);
              if (parsed) {
                setViewYear(parsed.getFullYear());
                setViewMonth(parsed.getMonth());
                setYearPageStart(getYearPageStart(parsed.getFullYear()));
                setPanelView("days");
              }
              return;
            }
            if (!isDisabledDay(todayIso)) {
              selectDay(todayIso);
            }
          }}
          disabled={panelView === "days" && isDisabledDay(todayIso)}
        >
          Today
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        disabled={disabled}
        aria-label={ariaLabel ?? placeholder}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={open ? popoverId : undefined}
        onClick={() => setOpen((o) => !o)}
        onMouseDown={(e) => {
          if (open) e.preventDefault();
        }}
        onKeyDown={handleTriggerKeyDown}
        className={cn(
          "touch-target flex h-10 w-full items-center rounded-xl border bg-[var(--color-surface)] px-3 text-left text-sm transition-colors",
          showIcon ? "gap-2" : "gap-0",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]",
          disabled && "cursor-not-allowed opacity-60",
          open
            ? "border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/15"
            : "border-[var(--color-input)] hover:border-[var(--color-primary)]/40",
          className,
        )}
      >
        {showIcon ? (
          <Calendar size={16} strokeWidth={1.75} className="shrink-0 text-[var(--color-muted)]" aria-hidden />
        ) : null}
        <span
          className={cn(
            "min-w-0 flex-1 truncate",
            value ? "font-medium text-[var(--color-foreground)]" : "text-[var(--color-subtle)]",
          )}
        >
          {value ? formatDateOnly(value) : placeholder}
        </span>
      </button>

      {open && typeof document !== "undefined" ? createPortal(pickerPanel, document.body) : null}
    </>
  );
}

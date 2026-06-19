"use client";

import { cn } from "@/src/lib/cn";

export type WaterfallRowTone = "neutral" | "warning" | "positive" | "negative";

const toneStyles: Record<WaterfallRowTone, string> = {
  neutral: "text-foreground",
  warning: "text-amber-700 dark:text-amber-400",
  positive: "text-emerald-700 dark:text-emerald-400",
  negative: "text-red-700 dark:text-red-400",
};

export function WaterfallRow({
  label,
  value,
  tone = "neutral",
  emphasized = false,
  dividerAfter = false,
  labelAction,
}: {
  label: string;
  value: string;
  tone?: WaterfallRowTone;
  emphasized?: boolean;
  dividerAfter?: boolean;
  labelAction?: React.ReactNode;
}) {
  return (
    <>
      <div
        className={cn(
          "flex items-baseline justify-between gap-4 py-2",
          emphasized && "border-t border-border pt-3",
        )}
      >
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span
            className={cn(
              "text-sm",
              emphasized ? "font-semibold text-foreground" : "text-muted",
            )}
          >
            {label}
          </span>
          {labelAction ? <div className="flex items-center">{labelAction}</div> : null}
        </div>
        <span
          className={cn(
            "shrink-0 font-mono text-sm tabular-nums",
            emphasized && "text-base font-semibold",
            toneStyles[tone],
          )}
        >
          {value}
        </span>
      </div>
      {dividerAfter ? <div className="border-b border-border/60" aria-hidden /> : null}
    </>
  );
}

export function WaterfallSection({
  id,
  title,
  helperText,
  children,
  titleAction,
}: {
  id: string;
  title: string;
  helperText?: string;
  children: React.ReactNode;
  titleAction?: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        <h3 id={id} className="text-xs font-semibold uppercase tracking-wide text-subtle">
          {title}
        </h3>
        {titleAction ? <div className="flex items-center">{titleAction}</div> : null}
      </div>
      {helperText ? <p className="text-xs text-muted">{helperText}</p> : null}
      <div role="list">{children}</div>
    </section>
  );
}

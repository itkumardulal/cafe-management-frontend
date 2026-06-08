"use client";

import type { ReactNode } from "react";
import { cn } from "@/src/lib/cn";

export type ListCardField = {
  label: string;
  value: ReactNode;
  /** Stack label above value — better for chips, badges, or multi-line content. */
  layout?: "inline" | "stack";
};

export function ListCard({
  title,
  subtitle,
  fields,
  badge,
  leading,
  actions,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  fields?: ListCardField[];
  badge?: ReactNode;
  leading?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)]",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        {leading ? <div className="shrink-0">{leading}</div> : null}
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[var(--color-foreground)]">{title}</p>
              {subtitle ? (
                <p className="mt-0.5 text-xs text-[var(--color-muted)]">{subtitle}</p>
              ) : null}
            </div>
            {badge ? <div className="shrink-0">{badge}</div> : null}
          </div>

          {fields && fields.length > 0 ? (
            <dl className="grid gap-2">
              {fields.map((field) =>
                field.layout === "stack" ? (
                  <div key={field.label} className="space-y-1.5 text-sm">
                    <dt className="text-xs font-medium uppercase tracking-wide text-[var(--color-subtle)]">
                      {field.label}
                    </dt>
                    <dd className="min-w-0 text-left text-sm text-[var(--color-foreground)]">
                      {field.value}
                    </dd>
                  </div>
                ) : (
                  <div
                    key={field.label}
                    className="flex items-baseline justify-between gap-3 text-sm"
                  >
                    <dt className="shrink-0 text-xs font-medium uppercase tracking-wide text-[var(--color-subtle)]">
                      {field.label}
                    </dt>
                    <dd className="min-w-0 text-right text-sm text-[var(--color-foreground)]">
                      {field.value}
                    </dd>
                  </div>
                ),
              )}
            </dl>
          ) : null}
        </div>
      </div>

      {actions ? (
        <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-[var(--color-border)] pt-4 [&_a]:inline-flex [&_a]:shrink-0">
          {actions}
        </div>
      ) : null}
    </article>
  );
}

export function ListCardStack({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("space-y-2 md:hidden", className)}>{children}</div>;
}

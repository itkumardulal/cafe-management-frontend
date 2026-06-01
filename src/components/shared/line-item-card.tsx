import type { ReactNode } from "react";
import { cn } from "@/src/lib/cn";

export type LineItemField = {
  label: string;
  value: ReactNode;
};

export function LineItemCard({
  title,
  fields,
  footer,
  className,
}: {
  title?: ReactNode;
  fields: LineItemField[];
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3",
        className,
      )}
    >
      {title ? (
        <p className="mb-2 text-sm font-medium text-[var(--color-foreground)]">{title}</p>
      ) : null}
      <dl className="grid gap-1.5">
        {fields.map((field) => (
          <div key={field.label} className="flex justify-between gap-3 text-sm">
            <dt className="text-xs text-[var(--color-muted)]">{field.label}</dt>
            <dd className="text-right font-medium text-[var(--color-foreground)]">{field.value}</dd>
          </div>
        ))}
      </dl>
      {footer ? <div className="mt-2 border-t border-[var(--color-border)] pt-2">{footer}</div> : null}
    </div>
  );
}

export function LineItemCardStack({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("space-y-2 md:hidden", className)}>{children}</div>;
}

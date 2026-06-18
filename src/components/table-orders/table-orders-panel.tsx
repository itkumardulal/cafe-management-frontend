import type { ReactNode } from "react";
import { tableOrdersPanelHeader } from "@/src/components/table-orders/table-orders-layout";
import { cn } from "@/src/lib/cn";

type TableOrdersPanelProps = {
  label: string;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
};

export function TableOrdersPanel({
  label,
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
}: TableOrdersPanelProps) {
  return (
    <section
      className={cn(
        "flex min-h-0 flex-col overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]",
        className,
      )}
    >
      <header className={tableOrdersPanelHeader}>
        <div className="min-w-0">
          {label ? (
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-muted)]">
              {label}
            </p>
          ) : null}
          <h2 className="text-sm font-semibold text-[var(--color-foreground)]">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-xs text-[var(--color-muted)]">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>
      <div className={cn("flex min-h-0 flex-1 flex-col", bodyClassName)}>{children}</div>
    </section>
  );
}

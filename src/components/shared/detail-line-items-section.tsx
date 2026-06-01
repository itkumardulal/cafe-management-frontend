import { type ReactNode } from "react";
import { LineItemCardStack } from "@/src/components/shared/line-item-card";
import { ResponsiveTable, type TableHeader } from "@/src/components/ui/table";
import { cn } from "@/src/lib/cn";

export type DetailLineItemsSectionProps = {
  title?: string;
  subtitle: string;
  headerAside?: ReactNode;
  headers: TableHeader[];
  ariaLabel: string;
  children: ReactNode;
  mobileLineItems?: ReactNode;
  className?: string;
};

/** Unified line-items block for preview/detail modals — single card, no nested table chrome. */
export function DetailLineItemsSection({
  title = "Line items",
  subtitle,
  headerAside,
  headers,
  ariaLabel,
  children,
  mobileLineItems,
  className,
}: DetailLineItemsSectionProps) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]",
        className,
      )}
    >
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
            {title}
          </p>
          <p className="mt-0.5 text-xs text-[var(--color-muted)]">{subtitle}</p>
        </div>
        {headerAside}
      </header>
      {mobileLineItems ? (
        <LineItemCardStack className="p-3">{mobileLineItems}</LineItemCardStack>
      ) : null}
      <div className={cn(mobileLineItems && "hidden md:block")}>
        <ResponsiveTable headers={headers} ariaLabel={ariaLabel} density="compact" variant="embedded">
          {children}
        </ResponsiveTable>
      </div>
    </section>
  );
}

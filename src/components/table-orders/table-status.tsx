import { cn } from "@/src/lib/cn";

export type TableStatus = "VACANT" | "IN_PROGRESS" | "IN_BILLING";

export type FloorTable = {
  tableId: string;
  tableName: string;
  status: TableStatus;
  sessionId: string | null;
  sessionTableNames: string[];
  subtotal: string | null;
  lineCount: number;
  lastItemName: string | null;
};

export const TABLE_STATUS: Record<
  TableStatus,
  {
    label: string;
    hint: string;
    dotClass: string;
    stripeClass: string;
    cardClass: string;
    chipClass: string;
    statClass: string;
    accentClass: string;
    statValueClass: string;
    /** Readable body copy on tinted cards (light + dark) */
    cardBodyClass: string;
    pulseDot?: boolean;
  }
> = {
  VACANT: {
    label: "Vacant",
    hint: "Ready for guests",
    dotClass: "bg-[var(--color-cream-200)]",
    stripeClass: "border-l-[var(--color-cream-200)]",
    cardClass: "bg-[var(--color-surface)]",
    chipClass:
      "border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-muted)]",
    statClass: "bg-[var(--color-surface-muted)]/60",
    accentClass: "text-[var(--color-muted)]",
    statValueClass: "text-[var(--color-foreground)]",
    cardBodyClass: "text-[var(--color-muted)]",
  },
  IN_PROGRESS: {
    label: "Serving",
    hint: "Tap to continue",
    dotClass: "bg-[var(--color-warning)]",
    stripeClass: "border-l-[var(--color-warning)]",
    cardClass:
      "bg-[var(--color-surface)] dark:bg-[color-mix(in_srgb,var(--color-warning)_10%,var(--color-surface))]",
    chipClass: "tone-warning-chip",
    statClass: "border tone-warning-panel",
    accentClass: "tone-warning-text",
    statValueClass: "text-[var(--color-foreground)]",
    cardBodyClass: "text-[var(--color-foreground)]",
    pulseDot: true,
  },
  IN_BILLING: {
    label: "Billing",
    hint: "At POS checkout",
    dotClass: "bg-[var(--color-primary)]",
    stripeClass: "border-l-[var(--color-primary)]",
    cardClass: "bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-surface))]",
    chipClass:
      "border-[color-mix(in_srgb,var(--color-primary)_35%,var(--color-border))] bg-[color-mix(in_srgb,var(--color-primary)_10%,var(--color-surface))] text-[var(--color-primary-hover)] dark:text-[var(--color-primary-hover)]",
    statClass:
      "border border-[color-mix(in_srgb,var(--color-primary)_25%,var(--color-border))] bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-surface))] dark:border-[color-mix(in_srgb,var(--color-primary)_35%,var(--color-border))]",
    accentClass: "text-[var(--color-primary-hover)] dark:text-[var(--color-primary-hover)]",
    statValueClass: "text-[var(--color-foreground)]",
    cardBodyClass: "text-[var(--color-foreground)]",
  },
};

export function StatusChip({
  status,
  className,
  pulse,
}: {
  status: TableStatus;
  className?: string;
  pulse?: boolean;
}) {
  const meta = TABLE_STATUS[status];
  const shouldPulse = pulse ?? meta.pulseDot;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-md border px-1.5 py-0.5 text-[10px] font-medium transition-colors",
        meta.chipClass,
        className,
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 shrink-0 rounded-full",
          meta.dotClass,
          shouldPulse && "motion-safe:animate-pulse",
        )}
        aria-hidden
      />
      {meta.label}
    </span>
  );
}

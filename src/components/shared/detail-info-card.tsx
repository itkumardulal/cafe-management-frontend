import { type ReactNode } from "react";
import { cn } from "@/src/lib/cn";

type DetailInfoCardProps = {
  label: string;
  children: ReactNode;
  className?: string;
  muted?: boolean;
};

/** Small labeled card used in preview/detail modals (reason, notes, dates, etc.). */
export function DetailInfoCard({ label, children, className, muted = false }: DetailInfoCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--color-border)] px-4 py-3",
        muted ? "bg-[var(--color-surface-muted)]/60" : "bg-[var(--color-surface)]",
        className,
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">{label}</p>
      <div className="mt-1 text-sm text-[var(--color-foreground)]">{children}</div>
    </div>
  );
}

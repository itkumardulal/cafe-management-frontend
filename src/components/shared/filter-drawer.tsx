"use client";

import { SlidersHorizontal } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/src/components/ui/button";
import { Drawer } from "@/src/components/ui/drawer";
import { cn } from "@/src/lib/cn";

export function FilterDrawer({
  open,
  onOpenChange,
  hasActiveFilters = false,
  onApply,
  onReset,
  children,
  title = "Filters",
  applyLabel = "Apply",
  resetLabel = "Reset",
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hasActiveFilters?: boolean;
  onApply: () => void;
  onReset: () => void;
  children: ReactNode;
  title?: string;
  applyLabel?: string;
  resetLabel?: string;
  className?: string;
}) {
  const handleApply = () => {
    onApply();
    onOpenChange(false);
  };

  return (
    <>
      <Button
        type="button"
        variant="brand"
        size="md"
        className={cn("relative md:hidden", className)}
        onClick={() => onOpenChange(true)}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <SlidersHorizontal size={16} aria-hidden />
        Filters
        {hasActiveFilters ? (
          <span
            className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-[var(--color-primary)] ring-2 ring-[var(--color-surface)]"
            aria-hidden
          />
        ) : null}
      </Button>

      <Drawer
        open={open}
        onClose={() => onOpenChange(false)}
        side="bottom"
        title={title}
        className="p-0"
      >
        <div className="flex max-h-[min(85dvh,640px)] flex-col">
          <div className="shrink-0 border-b border-[var(--color-border)] px-4 py-3">
            <h2 className="text-base font-semibold text-[var(--color-foreground)]">{title}</h2>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">{children}</div>
          <div className="safe-bottom flex shrink-0 flex-col gap-2 border-t border-[var(--color-border)] p-4 sm:flex-row">
            <Button type="button" variant="ghost" fullWidth onClick={onReset}>
              {resetLabel}
            </Button>
            <Button type="button" variant="brand" fullWidth onClick={handleApply}>
              {applyLabel}
            </Button>
          </div>
        </div>
      </Drawer>
    </>
  );
}

export function FilterDrawerDesktop({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("hidden md:block", className)}>{children}</div>;
}

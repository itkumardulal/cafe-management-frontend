"use client";

import { Eye, SquarePen, Trash2 } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/cn";

const actionBtnClass =
  "touch-target inline-flex h-11 w-11 min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-lg text-[var(--color-nav-idle)] transition-colors hover:bg-[var(--color-cream-100)] hover:text-[var(--color-nav-idle-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-50";

export function RowActions({
  onEdit,
  onDelete,
  onView,
  className,
  showLabels = false,
}: {
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
  className?: string;
  showLabels?: boolean;
}) {
  if (showLabels) {
    return (
      <div
        className={cn(
          "inline-flex flex-nowrap items-center justify-end gap-1.5",
          className,
        )}
      >
        {onView ? (
          <Button type="button" size="sm" variant="secondary" onClick={onView}>
            <span className="inline-flex items-center gap-1.5">
              <Eye size={15} strokeWidth={1.75} aria-hidden />
              View
            </span>
          </Button>
        ) : null}
        {onEdit ? (
          <Button type="button" size="sm" variant="secondary" onClick={onEdit}>
            <span className="inline-flex items-center gap-1.5">
              <SquarePen size={15} strokeWidth={1.75} aria-hidden />
              Edit
            </span>
          </Button>
        ) : null}
        {onDelete ? (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={onDelete}
            className="border-[var(--color-danger)]/50 text-[var(--color-danger)] hover:border-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 hover:text-[var(--color-danger)]"
          >
            <span className="inline-flex items-center gap-1.5">
              <Trash2 size={15} strokeWidth={1.75} aria-hidden />
              Delete
            </span>
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={cn("inline-flex items-center justify-end gap-0.5", className)}
    >
      {onView ? (
        <button
          type="button"
          onClick={onView}
          className={actionBtnClass}
          aria-label="View"
        >
          <Eye size={16} strokeWidth={1.75} aria-hidden />
        </button>
      ) : null}
      {onEdit ? (
        <button
          type="button"
          onClick={onEdit}
          className={actionBtnClass}
          aria-label="Edit"
        >
          <SquarePen size={16} strokeWidth={1.75} aria-hidden />
        </button>
      ) : null}
      {onDelete ? (
        <button
          type="button"
          onClick={onDelete}
          className={cn(actionBtnClass, "hover:text-[var(--color-danger)]")}
          aria-label="Delete"
        >
          <Trash2 size={16} strokeWidth={1.75} aria-hidden />
        </button>
      ) : null}
    </div>
  );
}

import { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { cn } from "@/src/lib/cn";

export function Field({
  id,
  label,
  error,
  hint,
  children,
  className,
  required,
  reserveErrorSpace = true,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
  required?: boolean;
  reserveErrorSpace?: boolean;
}) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  const control = isValidElement(children)
    ? cloneElement(
        children as ReactElement<{
          id?: string;
          "aria-describedby"?: string;
          "aria-invalid"?: boolean;
        }>,
        {
          id,
          "aria-describedby": describedBy,
          "aria-invalid": Boolean(error) || undefined,
        },
      )
    : children;

  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="block text-sm font-medium text-[var(--color-muted)]">
        {label}
        {required ? (
          <span className="ml-1 text-[var(--color-danger)]" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      {control}
      {hint && !error ? (
        <p id={`${id}-hint`} className="text-xs text-[var(--color-subtle)]">
          {hint}
        </p>
      ) : null}
      {reserveErrorSpace ? (
        <div className="min-h-[1.25rem]">
          {error ? (
            <p id={`${id}-error`} role="alert" className="text-xs text-[var(--color-danger)]">
              {error}
            </p>
          ) : null}
        </div>
      ) : error ? (
        <p id={`${id}-error`} role="alert" className="text-xs text-[var(--color-danger)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

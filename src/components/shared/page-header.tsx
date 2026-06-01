import type { ReactNode } from "react";
import { cn } from "@/src/lib/cn";

export function PageHeader({
  title,
  description,
  action,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4",
        className,
      )}
    >
      <div className="min-w-0 space-y-1">
        <h1 className="heading-display text-[var(--color-foreground)]">{title}</h1>
        {description ? <p className="text-muted">{description}</p> : null}
      </div>
      {action ? (
        <div className="w-full shrink-0 sm:w-auto [&_button]:w-full sm:[&_button]:w-auto [&_a]:block sm:[&_a]:inline-block [&_a_button]:w-full sm:[&_a_button]:w-auto">
          {action}
        </div>
      ) : null}
    </div>
  );
}

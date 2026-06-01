import type { LucideIcon } from "lucide-react";
import { SearchX } from "lucide-react";
import { Button } from "./button";
import { Card } from "./card";
import { cn } from "@/src/lib/cn";

export function EmptyState({
  title,
  description,
  icon: Icon,
  action,
  variant = "empty",
  className,
}: {
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: { label: string; onClick: () => void };
  variant?: "empty" | "no-results";
  className?: string;
}) {
  const DisplayIcon = Icon ?? (variant === "no-results" ? SearchX : undefined);

  return (
    <Card className={cn("px-6 py-10 text-center", className)}>
      {DisplayIcon ? (
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-surface-muted)] text-[var(--color-muted)]">
          <DisplayIcon className="h-6 w-6" aria-hidden />
        </div>
      ) : null}
      <h3 className="text-base font-semibold text-[var(--color-foreground)]">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-[var(--color-muted)]">{description}</p>
      {action ? (
        <Button type="button" size="sm" className="mt-5 w-full sm:w-auto" onClick={action.onClick}>
          {action.label}
        </Button>
      ) : null}
    </Card>
  );
}

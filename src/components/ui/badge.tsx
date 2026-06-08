import { type HTMLAttributes } from "react";
import { cn } from "@/src/lib/cn";

type BadgeVariant = "default" | "success" | "warning" | "danger";
type BadgeSize = "sm" | "md";

const badgeStyles: Record<BadgeVariant, string> = {
  default: "bg-[var(--color-cream-100)] text-[var(--color-muted)]",
  success: "bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-300",
  warning: "tone-warning-surface tone-warning-text",
  danger: "bg-red-100 text-red-800 dark:bg-red-950/70 dark:text-red-300",
};

export function Badge({
  className,
  variant = "default",
  size = "md",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant; size?: BadgeSize }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full font-medium",
        size === "md" ? "px-2.5 py-1 text-xs" : "px-2 py-0.5 text-[11px]",
        badgeStyles[variant],
        className,
      )}
      {...props}
    />
  );
}

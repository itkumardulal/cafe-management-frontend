import { type HTMLAttributes } from "react";
import { cn } from "@/src/lib/cn";

type BadgeVariant = "default" | "success" | "warning" | "danger";
type BadgeSize = "sm" | "md";

const badgeStyles: Record<BadgeVariant, string> = {
  default: "border border-[var(--color-border)] bg-[var(--color-cream-100)] text-[var(--color-muted)]",
  success: "tone-success-chip",
  warning: "tone-warning-chip",
  danger: "tone-danger-chip",
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

import { type HTMLAttributes } from "react";
import { cn } from "@/src/lib/cn";

type BadgeVariant = "default" | "success" | "warning" | "danger";
type BadgeSize = "sm" | "md";

const badgeStyles: Record<BadgeVariant, string> = {
  default: "bg-[var(--color-cream-100)] text-[var(--color-muted)]",
  success: "bg-green-100 text-green-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-red-100 text-red-700",
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

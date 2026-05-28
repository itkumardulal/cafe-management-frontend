import { type SelectHTMLAttributes, forwardRef } from "react";
import { cn } from "@/src/lib/cn";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  hasError?: boolean;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, hasError, size = "md", fullWidth = true, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "touch-target rounded-xl border bg-white px-3 text-sm outline-none transition-colors",
        fullWidth && "w-full",
        size === "sm" && "text-xs",
        size === "lg" && "text-base",
        hasError
          ? "border-[var(--color-danger)]"
          : "border-[var(--color-input)] focus:border-[var(--color-primary)]",
        className,
      )}
      {...props}
    />
  ),
);

Select.displayName = "Select";

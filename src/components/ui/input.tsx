import { type InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/src/lib/cn";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  hasError?: boolean;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, hasError, size = "md", fullWidth = true, type, onWheel, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        onWheel={
          type === "number"
            ? (e) => {
                e.currentTarget.blur();
                onWheel?.(e);
              }
            : onWheel
        }
        className={cn(
          "touch-target rounded-xl border bg-[var(--color-surface)] px-3 text-base md:text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-subtle)] caret-[var(--color-foreground)] outline-none transition-colors",
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
    );
  },
);

Input.displayName = "Input";

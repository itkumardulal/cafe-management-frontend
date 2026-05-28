"use client";

import { motion } from "framer-motion";
import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/src/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "shadow-[var(--shadow-sm)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary-hover)]",
  secondary:
    "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)] hover:bg-[var(--color-cream-100)] hover:border-[var(--color-input)]",
  ghost: "text-[var(--color-muted)] hover:bg-[var(--color-cream-100)]",
  danger: "bg-[var(--color-danger)] text-white hover:opacity-90",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 text-sm",
  md: "px-4 text-sm",
  lg: "px-5 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading,
      disabled,
      fullWidth,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.12 }}
        className={cn(
          "touch-target inline-flex items-center justify-center rounded-md font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60",
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && "w-full",
          className,
        )}
        disabled={disabled || loading}
        aria-busy={loading}
        aria-disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <span
            className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
            aria-hidden="true"
          />
        ) : null}
        {children}
      </motion.button>
    );
  },
);

Button.displayName = "Button";

"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef, type ReactNode } from "react";
import { cn } from "@/src/lib/cn";

type ButtonVariant = "primary" | "secondary" | "brand" | "soft" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = Omit<HTMLMotionProps<"button">, "ref" | "children"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  children?: ReactNode;
};

export type { ButtonProps, ButtonSize, ButtonVariant };

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "shadow-[var(--shadow-sm)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]",
  secondary:
    "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-foreground)] hover:bg-[var(--color-cream-100)] hover:border-[var(--color-input)]",
  brand:
    "shadow-[var(--shadow-sm)] border border-[var(--color-btn-secondary-border)] bg-[var(--color-btn-secondary-bg)] text-[var(--color-btn-secondary-fg)] hover:bg-[var(--color-btn-secondary-bg-hover)] hover:border-[color-mix(in_srgb,var(--color-primary)_40%,var(--color-btn-secondary-border))] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]/35",
  soft:
    "border border-[color-mix(in_srgb,var(--color-primary)_32%,var(--color-border))] bg-[var(--color-primary-soft)] font-medium text-[var(--color-nav-active-text)] hover:border-[color-mix(in_srgb,var(--color-primary)_48%,var(--color-border))] hover:bg-[color-mix(in_srgb,var(--color-primary-soft)_75%,var(--color-primary)_25%)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]/35",
  ghost:
    "text-[var(--color-nav-idle)] hover:bg-[var(--color-cream-100)] hover:text-[var(--color-nav-idle-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]/30",
  danger:
    "shadow-[var(--shadow-sm)] bg-[var(--color-danger)] text-white hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-danger)]",
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
          "touch-target inline-flex cursor-pointer items-center justify-center rounded-md font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60",
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

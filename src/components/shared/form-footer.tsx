import type { ReactNode } from "react";
import { cn } from "@/src/lib/cn";

type FormFooterProps = {
  children: ReactNode;
  className?: string;
  /** Use inside Modal `footer` slot — no sticky overlap with modal chrome */
  variant?: "form" | "modal";
};

export function FormFooter({
  children,
  className,
  variant = "form",
}: FormFooterProps) {
  return (
    <div
      className={cn(
        "[&_button]:w-full sm:[&_button]:w-auto",
        variant === "form" &&
          "safe-bottom sticky bottom-0 -mx-5 flex flex-col-reverse gap-2 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3 sm:-mx-6 sm:flex-row sm:justify-end sm:gap-3 sm:px-6 md:static md:mx-0 md:border-0 md:bg-transparent md:px-0 md:py-0",
        variant === "modal" &&
          "flex w-full flex-col gap-2 sm:flex-row sm:justify-end sm:gap-3",
        className,
      )}
    >
      {children}
    </div>
  );
}

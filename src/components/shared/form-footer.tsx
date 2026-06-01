import type { ReactNode } from "react";
import { cn } from "@/src/lib/cn";

export function FormFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "safe-bottom sticky bottom-0 -mx-5 flex flex-col-reverse gap-2 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3 sm:-mx-6 sm:flex-row sm:justify-end sm:px-6 md:static md:mx-0 md:border-0 md:bg-transparent md:px-0 md:py-0",
        "[&_button]:w-full sm:[&_button]:w-auto",
        className,
      )}
    >
      {children}
    </div>
  );
}

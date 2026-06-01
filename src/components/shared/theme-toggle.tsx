"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/src/components/shared/theme-provider";
import { cn } from "@/src/lib/cn";

const iconClass = "size-4 shrink-0";

const segmentBase =
  "inline-flex h-8 w-8 items-center justify-center gap-1 rounded-full text-xs font-medium transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--color-primary)] md:w-auto md:px-2.5";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, mounted } = useTheme();

  if (!mounted) {
    return (
      <div
        className={cn("h-9 w-[4.25rem] animate-pulse rounded-full bg-[var(--color-surface-muted)] md:w-[7.25rem]", className)}
        aria-hidden
      />
    );
  }

  const isLight = theme === "light";

  return (
    <div
      role="group"
      aria-label="Appearance"
      className={cn(
        "inline-flex h-9 shrink-0 items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-0.5",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setTheme("light")}
        aria-pressed={isLight}
        aria-label="Light mode"
        title="Light mode"
        className={cn(
          segmentBase,
          isLight
            ? "bg-[var(--color-surface)] text-[var(--color-primary)] shadow-[var(--shadow-sm)]"
            : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]",
        )}
      >
        <Sun className={iconClass} strokeWidth={2.25} aria-hidden />
        <span className="hidden md:inline">Light</span>
      </button>
      <button
        type="button"
        onClick={() => setTheme("dark")}
        aria-pressed={!isLight}
        aria-label="Dark mode"
        title="Dark mode"
        className={cn(
          segmentBase,
          !isLight
            ? "bg-[var(--color-surface)] text-[var(--color-foreground)] shadow-[var(--shadow-sm)]"
            : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]",
        )}
      >
        <Moon className={iconClass} strokeWidth={2.25} aria-hidden />
        <span className="hidden md:inline">Dark</span>
      </button>
    </div>
  );
}

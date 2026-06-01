"use client";

import { Check, Circle } from "lucide-react";
import { passwordChecklistRules } from "@/src/features/auth/schemas/password.schema";
import { cn } from "@/src/lib/cn";

type PasswordChecklistProps = {
  password: string;
  className?: string;
  compact?: boolean;
};

export function PasswordChecklist({ password, className, compact = false }: PasswordChecklistProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-[var(--color-border)] bg-[var(--color-cream-50)]/60 dark:bg-[var(--color-surface-muted)]/40",
        compact ? "px-2.5 py-2" : "rounded-xl px-3 py-2.5",
        className,
      )}
      aria-live="polite"
    >
      {!compact ? (
        <p className="mb-1.5 text-xs font-medium text-[var(--color-muted)]">Password requirements</p>
      ) : null}
      <ul
        className={cn(
          "grid grid-cols-2 gap-x-2 gap-y-0.5",
          compact ? "text-[11px] leading-tight" : "gap-y-1 text-xs leading-snug sm:gap-x-3",
        )}
        aria-label="Password requirements"
      >
        {passwordChecklistRules.map((rule) => {
          const passed = rule.test(password);
          return (
            <li
              key={rule.id}
              className={cn(
                "flex items-center gap-1",
                passed ? "text-emerald-600 dark:text-emerald-400" : "text-[var(--color-subtle)]",
              )}
            >
              {passed ? (
                <Check size={12} strokeWidth={2.25} className="shrink-0" aria-hidden="true" />
              ) : (
                <Circle size={12} strokeWidth={2} className="shrink-0 opacity-50" aria-hidden="true" />
              )}
              <span>{rule.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

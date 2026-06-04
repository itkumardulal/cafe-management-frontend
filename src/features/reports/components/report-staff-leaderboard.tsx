"use client";

import { Card } from "@/src/components/ui/card";
import { cn } from "@/src/lib/cn";
import { formatMoney } from "@/src/lib/format-display";

type StaffEntry = {
  staffId: string | null;
  staffName: string;
  transactionCount: number;
  totalDiscountAmount: string;
};

export function ReportStaffLeaderboard({
  staff,
  totalDiscount,
}: {
  staff: StaffEntry[];
  totalDiscount: string;
}) {
  if (staff.length === 0) return null;

  const maxAmount = Math.max(...staff.map((s) => Number(s.totalDiscountAmount) || 0), 1);
  const total = Number(totalDiscount) || 1;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-subtle">By staff member</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {staff.map((member, index) => {
          const amount = Number(member.totalDiscountAmount) || 0;
          const share = total > 0 ? Math.round((amount / total) * 100) : 0;
          const barWidth = Math.round((amount / maxAmount) * 100);

          return (
            <Card key={member.staffId ?? member.staffName} density="compact" className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{member.staffName}</p>
                  <p className="text-xs text-muted">
                    {member.transactionCount} bill{member.transactionCount === 1 ? "" : "s"}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
                    index === 0
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
                      : "bg-[var(--color-cream-100)] text-muted",
                  )}
                >
                  #{index + 1}
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-lg font-semibold tabular-nums">{formatMoney(amount)}</span>
                  <span className="text-xs text-muted">{share}% of total</span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--color-surface-muted)]">
                  <div
                    className="h-full rounded-full bg-[var(--color-primary)] transition-all"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

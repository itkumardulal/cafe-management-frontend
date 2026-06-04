"use client";

import type { ReactNode } from "react";
import { Card } from "@/src/components/ui/card";
import { cn } from "@/src/lib/cn";
import {
  ResponsiveTable,
  type TableHeader,
} from "@/src/components/ui/table";

type ReportDataTableProps = {
  headers: TableHeader[];
  children: ReactNode;
  mobileCards?: ReactNode;
  className?: string;
};

export function ReportDataTable({
  headers,
  children,
  mobileCards,
  className,
}: ReportDataTableProps) {
  return (
    <div className={cn("space-y-0", className)}>
      {mobileCards}
      <Card
        density="comfortable"
        className={cn("overflow-hidden p-0", mobileCards && "hidden md:block")}
      >
        <ResponsiveTable variant="embedded" headers={headers} horizontalScroll={false}>
          {children}
        </ResponsiveTable>
      </Card>
    </div>
  );
}

export function ReportRankBadge({ rank }: { rank: number }) {
  const tone =
    rank === 1
      ? "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
      : rank === 2
        ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
        : rank === 3
          ? "bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-300"
          : "bg-[var(--color-cream-100)] text-muted";

  return (
    <span
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs font-semibold tabular-nums",
        tone,
      )}
    >
      {rank}
    </span>
  );
}

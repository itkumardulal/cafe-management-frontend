"use client";

import type { ReactNode } from "react";
import { cn } from "@/src/lib/cn";
import { tableCenterCellClass } from "@/src/components/ui/table";

export function ReportTableFooterRow({
  label = "Total",
  cells,
  className,
}: {
  label?: string;
  cells: ReactNode[];
  className?: string;
}) {
  return (
    <tr
      className={cn(
        "border-t-2 border-[var(--color-border)] bg-[var(--color-surface-muted)] font-semibold",
        className,
      )}
    >
      <td>{label}</td>
      {cells.map((cell, index) => (
        <td key={index} className={cn(tableCenterCellClass, "tabular-nums")}>
          {cell}
        </td>
      ))}
    </tr>
  );
}

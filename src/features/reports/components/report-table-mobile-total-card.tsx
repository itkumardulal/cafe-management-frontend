"use client";

import { ListCard, type ListCardField } from "@/src/components/shared/list-card";

export function ReportTableMobileTotalCard({
  label = "Total",
  fields,
}: {
  label?: string;
  fields: ListCardField[];
}) {
  return (
    <ListCard
      title={label}
      className="border-[var(--color-border)] bg-[var(--color-surface-muted)]"
      fields={fields}
    />
  );
}

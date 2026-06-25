"use client";

import { ThermalDivider } from "@/src/features/printing/components/thermal-divider";
import { ThermalKotHeader } from "@/src/features/printing/components/thermal-kot-header";
import { ThermalLineItems } from "@/src/features/printing/components/thermal-line-items";
import { ThermalReceiptShell } from "@/src/features/printing/components/thermal-receipt-shell";
import { formatCompactDateTime } from "@/src/features/printing/lib/thermal-text";
import { cn } from "@/src/lib/cn";
import type { TableOrderKotBatch } from "@/src/services/operations-api";

export type TableOrderKotPrintData = TableOrderKotBatch;

type TableOrderKotReceiptProps = {
  batch: TableOrderKotPrintData;
  className?: string;
  id?: string;
};

export function TableOrderKotReceipt({ batch, className, id }: TableOrderKotReceiptProps) {
  const batchTitle =
    batch.batchNo > 1 ? `${batch.label} ${batch.batchNo}` : batch.label;

  return (
    <ThermalReceiptShell id={id} className={cn(className)}>
      <ThermalKotHeader
        batchTitle={batchTitle}
        tableNames={batch.tableNamesSnapshot}
        printedAt={formatCompactDateTime(batch.createdAt)}
        itemCount={batch.lines.length}
        waiterName={batch.createdByName}
      />

      <ThermalLineItems
        variant="kot"
        lines={batch.lines.map((line) => ({
          name: line.menuItemName,
          quantity: line.quantity,
          notes: line.notes,
        }))}
      />

      <ThermalDivider />

      <footer className="pt-2 text-center">
        <p className="text-[10px] font-medium uppercase tracking-wide">Kitchen copy</p>
      </footer>
    </ThermalReceiptShell>
  );
}

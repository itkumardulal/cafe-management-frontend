"use client";

import type { TableOrderInterimBill } from "@/src/services/operations-api";
import { ThermalDivider } from "@/src/features/printing/components/thermal-divider";
import { ThermalLineItems } from "@/src/features/printing/components/thermal-line-items";
import { ThermalReceiptHeader } from "@/src/features/printing/components/thermal-receipt-header";
import { ThermalReceiptMeta } from "@/src/features/printing/components/thermal-receipt-meta";
import { ThermalReceiptShell } from "@/src/features/printing/components/thermal-receipt-shell";
import { ThermalRow } from "@/src/features/printing/components/thermal-row";
import { formatMoneyCompact } from "@/src/features/printing/lib/thermal-money";
import { formatCompactDateTime } from "@/src/features/printing/lib/thermal-text";
import { cn } from "@/src/lib/cn";

export type TableOrderInterimPrintData = TableOrderInterimBill;

type TableOrderInterimReceiptProps = {
  bill: TableOrderInterimPrintData;
  className?: string;
  id?: string;
};

export function TableOrderInterimReceipt({
  bill,
  className,
  id,
}: TableOrderInterimReceiptProps) {
  const contact = bill.cafe.contactNumber ?? bill.cafe.email;
  const tableLabel =
    bill.tableNames.length > 0 ? `Table ${bill.tableNames.join(", ")}` : null;

  return (
    <ThermalReceiptShell id={id} className={cn(className)}>
      <ThermalReceiptHeader
        cafeName={bill.cafe.cafeName}
        logoUrl={bill.cafe.logo}
        address={bill.cafe.address}
        contact={contact}
        title="Interim bill"
        badge="DINE IN"
        subtitle={tableLabel}
      />

      <ThermalReceiptMeta
        items={[
          { label: "Date", value: formatCompactDateTime(bill.printedAt) },
          { label: "Items", value: formatMoneyCompact(bill.itemQuantityTotal) },
          ...(tableLabel ? [{ label: "Table", value: bill.tableNames.join(", ") }] : []),
          ...(bill.createdByName
            ? [{ label: "Waiter", value: bill.createdByName }]
            : []),
        ]}
      />

      <ThermalDivider />

      <ThermalLineItems
        variant="sale"
        lines={bill.lines.map((line) => ({
          name: line.menuItemName,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          lineTotal: line.lineTotal,
          notes: line.notes,
        }))}
      />

      <ThermalDivider />

      <div className="space-y-0.5 text-[10px]">
        <ThermalRow label="Subtotal" value={formatMoneyCompact(bill.subtotal)} />
        <ThermalRow
          label="Grand total"
          value={`Rs ${formatMoneyCompact(bill.grandTotal)}`}
          bold
          className="pt-0.5 text-[12px]"
        />
      </div>

      <footer className="mt-3 border-t border-black pt-2 text-center">
        <p className="text-[9px] leading-snug text-black/80">
          Not a final bill — payment not taken. Totals may change before settlement.
        </p>
      </footer>
    </ThermalReceiptShell>
  );
}

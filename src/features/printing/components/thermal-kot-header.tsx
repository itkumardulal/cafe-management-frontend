"use client";

import { ThermalDivider } from "@/src/features/printing/components/thermal-divider";

type ThermalKotHeaderProps = {
  batchTitle: string;
  tableNames: string;
  printedAt: string;
  itemCount: number;
  waiterName?: string | null;
};

/** Kitchen ticket header — no cafe logo or name (POS receipts keep full branding). */
export function ThermalKotHeader({
  batchTitle,
  tableNames,
  printedAt,
  itemCount,
  waiterName,
}: ThermalKotHeaderProps) {
  return (
    <header className="thermal-receipt-header">
      <div className="border-y border-black py-1.5 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em]">Kitchen order</p>
      </div>

      <div className="thermal-receipt-meta-row mt-1.5 flex items-baseline justify-between gap-3">
        <span className="text-left text-[10px] font-bold uppercase tracking-wide">
          {batchTitle}
        </span>
        <span className="ml-auto text-right text-[10px] font-medium">Table {tableNames}</span>
      </div>

      {waiterName ? (
        <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide">
          Waiter: {waiterName}
        </p>
      ) : null}

      <p className="mt-1 text-[9px] leading-snug text-black/80">
        Printed {printedAt} · {itemCount} item{itemCount === 1 ? "" : "s"}
      </p>

      <ThermalDivider />
    </header>
  );
}

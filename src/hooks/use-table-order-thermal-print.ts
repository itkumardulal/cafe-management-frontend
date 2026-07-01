"use client";

import type { TableOrderKotBatch } from "@/src/services/operations-api";
import type { TableOrderInterimPrintData } from "@/src/components/table-orders/table-order-interim-receipt";
import { useThermalPrint } from "@/src/features/printing/hooks/use-thermal-print";

export type TableOrderPrintDocument =
  | { kind: "kot"; batch: TableOrderKotBatch }
  | { kind: "interim"; bill: TableOrderInterimPrintData };

type UseTableOrderThermalPrintOptions = {
  onError?: (error: unknown) => void;
  onAfterPrint?: () => void;
};

export function useTableOrderThermalPrint(options: UseTableOrderThermalPrintOptions = {}) {
  const { printDocument, isPrinting, printLoaded } =
    useThermalPrint<TableOrderPrintDocument>(options);

  const printKot = (batch: TableOrderKotBatch) => {
    printLoaded({ kind: "kot", batch });
  };

  const printInterimBill = (bill: TableOrderInterimPrintData) => {
    printLoaded({ kind: "interim", bill });
  };

  return {
    printDocument,
    isPrintBusy: isPrinting,
    printKot,
    printInterimBill,
  };
}

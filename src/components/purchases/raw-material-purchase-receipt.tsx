"use client";

import {
  PurchaseThermalReceipt,
  type PurchaseThermalReceiptData,
} from "@/src/features/printing/components/purchase-thermal-receipt";
import type { PurchaseBillingType } from "@/src/lib/money-input";
import type { PurchasePaymentStatus } from "@/src/lib/ap-types";
import { formatMoney } from "@/src/lib/format-display";

export type RmPurchaseReceiptLine = {
  id?: string;
  rawMaterialItem: { name: string; unit: string };
  supplier: { name: string };
  quantity: string;
  ratePerUnit: string;
  lineTotal: string;
};

export type RmPurchaseReceiptData = {
  receiptNo: string;
  purchaseDate: string;
  createdAt: string;
  notes?: string | null;
  createdByName?: string | null;
  lineCount: number;
  billingType?: PurchaseBillingType;
  paymentStatus?: PurchasePaymentStatus;
  paidAmount?: string;
  remainingAmount?: string;
  grandTotal: string;
  cashPaidAmount?: string;
  bankPaidAmount?: string;
  creditAmount?: string;
  bankPaymentScreenshotUrl?: string | null;
  lines: RmPurchaseReceiptLine[];
  cafe?: {
    cafeName: string;
    address?: string | null;
    contactNumber?: string | null;
    email?: string;
  } | null;
};

type RawMaterialPurchaseReceiptProps = {
  purchase: RmPurchaseReceiptData;
  cafeName?: string;
  className?: string;
  id?: string;
};

function toThermalData(purchase: RmPurchaseReceiptData): PurchaseThermalReceiptData {
  return {
    receiptNo: purchase.receiptNo,
    purchaseDate: purchase.purchaseDate,
    createdAt: purchase.createdAt,
    notes: purchase.notes,
    createdByName: purchase.createdByName,
    lineCount: purchase.lineCount,
    billingType: purchase.billingType,
    paymentStatus: purchase.paymentStatus,
    grandTotal: purchase.grandTotal,
    cashPaidAmount: purchase.cashPaidAmount,
    bankPaidAmount: purchase.bankPaidAmount,
    creditAmount: purchase.creditAmount,
    bankPaymentScreenshotUrl: purchase.bankPaymentScreenshotUrl,
    cafe: purchase.cafe,
    lines: purchase.lines.map((line) => ({
      name: line.rawMaterialItem.name,
      subline: line.supplier.name,
      detail: `@ ${formatMoney(line.ratePerUnit)} / ${line.rawMaterialItem.unit}`,
      quantity: line.quantity,
      lineTotal: line.lineTotal,
    })),
  };
}

export function RawMaterialPurchaseReceipt({
  purchase,
  cafeName,
  className,
  id,
}: RawMaterialPurchaseReceiptProps) {
  return (
    <PurchaseThermalReceipt
      id={id}
      variant="raw-material"
      purchase={toThermalData(purchase)}
      cafeName={cafeName}
      className={className}
    />
  );
}

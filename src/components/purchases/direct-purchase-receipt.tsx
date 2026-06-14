"use client";

import {
  PurchaseThermalReceipt,
  type PurchaseThermalReceiptData,
} from "@/src/features/printing/components/purchase-thermal-receipt";
import type { PurchaseBillingType } from "@/src/lib/money-input";
import type { PurchasePaymentStatus } from "@/src/lib/ap-types";
import { formatMoney } from "@/src/lib/format-display";

export type DirectPurchaseReceiptLine = {
  id?: string;
  item: { name: string; unitType?: string | null; unitQuantity?: string | null };
  supplier: { name: string };
  quantity: string;
  ratePerUnit: string;
  lineTotal: string;
};

function formatItemUnit(item: { unitType?: string | null; unitQuantity?: string | null }) {
  const parts = [item.unitQuantity?.trim(), item.unitType?.trim()].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : null;
}

export type DirectPurchaseReceiptData = {
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
  lines: DirectPurchaseReceiptLine[];
  cafe?: {
    cafeName: string;
    logo?: string | null;
    address?: string | null;
    contactNumber?: string | null;
    email?: string;
  } | null;
};

type DirectPurchaseReceiptProps = {
  purchase: DirectPurchaseReceiptData;
  cafeName?: string;
  className?: string;
  id?: string;
};

function toThermalData(purchase: DirectPurchaseReceiptData): PurchaseThermalReceiptData {
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
    lines: purchase.lines.map((line) => {
      const unit = formatItemUnit(line.item);
      return {
        name: line.item.name,
        subline: line.supplier.name,
        detail: unit
          ? `@ ${formatMoney(line.ratePerUnit)} / ${unit}`
          : `@ ${formatMoney(line.ratePerUnit)}`,
        quantity: line.quantity,
        lineTotal: line.lineTotal,
      };
    }),
  };
}

export function DirectPurchaseReceipt({
  purchase,
  cafeName,
  className,
  id,
}: DirectPurchaseReceiptProps) {
  return (
    <PurchaseThermalReceipt
      id={id}
      variant="direct"
      purchase={toThermalData(purchase)}
      cafeName={cafeName}
      className={className}
    />
  );
}

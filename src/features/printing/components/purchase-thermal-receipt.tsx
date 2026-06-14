"use client";

import { formatDateOnly } from "@/src/lib/format-display";
import {
  getPurchasePaymentStatus,
  purchasePaymentStatusLabel,
  type PurchaseBillingType,
} from "@/src/lib/money-input";
import type { PurchasePaymentStatus } from "@/src/lib/ap-types";
import { ThermalDivider } from "@/src/features/printing/components/thermal-divider";
import { ThermalLineItems } from "@/src/features/printing/components/thermal-line-items";
import { ThermalPaymentBlock } from "@/src/features/printing/components/thermal-payment-block";
import { ThermalReceiptHeader } from "@/src/features/printing/components/thermal-receipt-header";
import { ThermalReceiptMeta } from "@/src/features/printing/components/thermal-receipt-meta";
import { ThermalReceiptShell } from "@/src/features/printing/components/thermal-receipt-shell";
import { ThermalRow } from "@/src/features/printing/components/thermal-row";
import { formatMoneyCompact } from "@/src/features/printing/lib/thermal-money";
import { formatCompactDateTime } from "@/src/features/printing/lib/thermal-text";
import { cn } from "@/src/lib/cn";

export type PurchaseThermalReceiptLine = {
  name: string;
  subline?: string | null;
  detail?: string | null;
  quantity?: string | null;
  lineTotal: string;
};

export type PurchaseThermalReceiptData = {
  receiptNo: string;
  purchaseDate: string;
  createdAt: string;
  notes?: string | null;
  createdByName?: string | null;
  lineCount: number;
  billingType?: PurchaseBillingType;
  paymentStatus?: PurchasePaymentStatus;
  grandTotal: string;
  cashPaidAmount?: string;
  bankPaidAmount?: string;
  creditAmount?: string;
  bankPaymentScreenshotUrl?: string | null;
  lines: PurchaseThermalReceiptLine[];
  cafe?: {
    cafeName: string;
    logo?: string | null;
    address?: string | null;
    contactNumber?: string | null;
    email?: string;
  } | null;
};

type PurchaseThermalReceiptProps = {
  purchase: PurchaseThermalReceiptData;
  variant: "raw-material" | "direct";
  cafeName?: string;
  className?: string;
  id?: string;
};

const VARIANT_CONFIG = {
  "raw-material": {
    title: "Raw material purchase",
    footer: "Expense record — does not update stock",
  },
  direct: {
    title: "Direct purchase",
    footer: "Stock purchase — updates inventory",
  },
} as const;

export function PurchaseThermalReceipt({
  purchase,
  variant,
  cafeName,
  className,
  id,
}: PurchaseThermalReceiptProps) {
  const config = VARIANT_CONFIG[variant];
  const name = cafeName ?? purchase.cafe?.cafeName ?? "Cafe";
  const contact = purchase.cafe?.contactNumber ?? purchase.cafe?.email;
  const cash = Number(purchase.cashPaidAmount ?? 0);
  const bank = Number(purchase.bankPaidAmount ?? 0);
  const credit = Number(purchase.creditAmount ?? 0);
  const paymentStatus = getPurchasePaymentStatus({
    billingType: purchase.billingType ?? "PAID",
    grandTotal: purchase.grandTotal,
    cashPaidAmount: purchase.cashPaidAmount ?? "0",
    bankPaidAmount: purchase.bankPaidAmount ?? "0",
    creditAmount: purchase.creditAmount ?? "0",
  });
  const hasPaymentBreakdown = paymentStatus !== "not_recorded";

  const paymentRows = [
    cash > 0.005 ? { label: "Cash paid", value: formatMoneyCompact(cash) } : null,
    bank > 0.005 ? { label: "Bank paid", value: formatMoneyCompact(bank) } : null,
    credit > 0.005
      ? { label: "Credit due", value: formatMoneyCompact(credit), bold: true }
      : null,
  ].filter((row): row is { label: string; value: string; bold?: boolean } => row !== null);

  return (
    <ThermalReceiptShell id={id} className={cn(className)}>
      <ThermalReceiptHeader
        cafeName={name}
        logoUrl={purchase.cafe?.logo}
        address={purchase.cafe?.address}
        contact={contact}
        title={config.title}
      />

      <ThermalReceiptMeta
        items={[
          { label: "Receipt", value: purchase.receiptNo },
          { label: "Purchase date", value: formatDateOnly(purchase.purchaseDate) },
          { label: "Recorded", value: formatCompactDateTime(purchase.createdAt) },
          ...(purchase.createdByName
            ? [{ label: "Recorded by", value: purchase.createdByName }]
            : []),
        ]}
      />

      <ThermalDivider />

      <ThermalLineItems variant="purchase" lines={purchase.lines} />

      <ThermalDivider />

      <div className="space-y-0.5 text-[10px]">
        <ThermalRow label="Line items" value={String(purchase.lineCount)} />
        <ThermalRow
          label="Grand total"
          value={`Rs ${formatMoneyCompact(purchase.grandTotal)}`}
          bold
          className="pt-0.5 text-[12px]"
        />
      </div>

      {hasPaymentBreakdown ? (
        <ThermalPaymentBlock
          statusLabel={purchasePaymentStatusLabel(paymentStatus)}
          rows={paymentRows}
          footnote={
            bank > 0.005 && purchase.bankPaymentScreenshotUrl
              ? "Bank transfer proof on file"
              : null
          }
        />
      ) : null}

      {purchase.notes?.trim() ? (
        <>
          <ThermalDivider />
          <div className="text-[10px]">
            <p className="font-semibold uppercase tracking-wide">Notes</p>
            <p className="mt-0.5 leading-snug">{purchase.notes.trim()}</p>
          </div>
        </>
      ) : null}

      <footer className="mt-3 border-t border-black pt-2 text-center">
        <p className="text-[11px] font-medium">Thank you</p>
        <p className="mt-0.5 text-[9px]">{config.footer}</p>
      </footer>
    </ThermalReceiptShell>
  );
}

"use client";

import type { SaleDetailResponse } from "@/src/lib/ar-types";
import {
  SALE_PAYMENT_TERMS_OPTIONS,
} from "@/src/lib/ar-display";
import { ThermalCreditBlock } from "@/src/features/printing/components/thermal-credit-block";
import { ThermalCustomerBlock } from "@/src/features/printing/components/thermal-customer-block";
import { ThermalDivider } from "@/src/features/printing/components/thermal-divider";
import { ThermalLineItems } from "@/src/features/printing/components/thermal-line-items";
import { ThermalPaymentBlock } from "@/src/features/printing/components/thermal-payment-block";
import { ThermalReceiptHeader } from "@/src/features/printing/components/thermal-receipt-header";
import { ThermalReceiptMeta } from "@/src/features/printing/components/thermal-receipt-meta";
import { ThermalReceiptShell } from "@/src/features/printing/components/thermal-receipt-shell";
import { ThermalRow } from "@/src/features/printing/components/thermal-row";
import { serviceLabel } from "@/src/features/printing/lib/pos-labels";
import { formatMoneyCompact } from "@/src/features/printing/lib/thermal-money";
import { formatCompactDateTime } from "@/src/features/printing/lib/thermal-text";
import { cn } from "@/src/lib/cn";

export type PosSaleReceiptLine = {
  menuItemName: string;
  quantity: string;
  unitPrice: string;
  lineTotal: string;
};

export type PosSaleReceiptData = SaleDetailResponse & {
  id?: string;
};

function paymentTermsLabel(preset: PosSaleReceiptData["paymentTermsPreset"]) {
  if (!preset) return null;
  return SALE_PAYMENT_TERMS_OPTIONS.find((o) => o.value === preset)?.label ?? null;
}

type PosSaleReceiptProps = {
  sale: PosSaleReceiptData;
  cafeName?: string;
  className?: string;
  id?: string;
};

export function PosSaleReceipt({ sale, cafeName, className, id }: PosSaleReceiptProps) {
  const name = cafeName ?? sale.cafe?.cafeName ?? "Cafe";
  const contact = sale.cafe?.contactNumber ?? sale.cafe?.email;
  const hasCustomer =
    sale.customerName?.trim() ||
    sale.customerPhone?.trim() ||
    sale.customerAddress?.trim() ||
    sale.customerEmail?.trim();

  const creditNum = Number(sale.creditAmount);
  const hasCredit = Number.isFinite(creditNum) && creditNum > 0.005;
  const amountReceived =
    Number(sale.cashPaidAmount ?? 0) + Number(sale.bankPaidAmount ?? 0);

  const tableLabel =
    sale.serviceType === "DINE_IN" && (sale.tableNamesSnapshot || sale.tableName)
      ? `Table ${sale.tableNamesSnapshot ?? sale.tableName}`
      : null;

  const paymentRows = [
    Number(sale.cashPaidAmount) > 0
      ? { label: "Cash", value: formatMoneyCompact(sale.cashPaidAmount) }
      : null,
    Number(sale.bankPaidAmount) > 0
      ? {
          label: "Bank",
          value: formatMoneyCompact(sale.bankPaidAmount),
        }
      : null,
    hasCredit
      ? { label: "Credit due", value: formatMoneyCompact(sale.creditAmount), bold: true }
      : null,
    amountReceived > 0
      ? { label: "Amount received", value: formatMoneyCompact(amountReceived), bold: true }
      : null,
    Number(sale.changeAmount ?? 0) > 0
      ? { label: "Change returned", value: formatMoneyCompact(sale.changeAmount), bold: true }
      : null,
  ].filter((row): row is { label: string; value: string; bold?: boolean } => row !== null);

  const addressPrefix =
    sale.customerAddress?.trim() && sale.serviceType === "DELIVERY"
      ? "Deliver to:"
      : null;

  return (
    <ThermalReceiptShell id={id} className={cn(className)}>
      <ThermalReceiptHeader
        cafeName={name}
        logoUrl={sale.cafe?.logo}
        address={sale.cafe?.address}
        contact={contact}
        title="Sales receipt"
        badge={serviceLabel(sale.serviceType).toUpperCase()}
        subtitle={tableLabel}
      />

      <ThermalReceiptMeta
        items={[
          { label: "Receipt", value: sale.receiptNo },
          { label: "Date", value: formatCompactDateTime(sale.saleAt) },
          ...(sale.createdByName ? [{ label: "Cashier", value: sale.createdByName }] : []),
        ]}
      />

      {hasCustomer ? (
        <>
          <ThermalDivider />
          <ThermalCustomerBlock
            name={sale.customerName}
            phone={sale.customerPhone}
            address={sale.customerAddress}
            email={sale.customerEmail}
            addressPrefix={addressPrefix}
          />
        </>
      ) : null}

      <ThermalDivider />

      <ThermalLineItems
        variant="sale"
        lines={sale.lines.map((line) => ({
          name: line.menuItemName,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          lineTotal: line.lineTotal,
        }))}
      />

      <ThermalDivider />

      <div className="space-y-0.5 text-[10px]">
        <ThermalRow label="Subtotal" value={formatMoneyCompact(sale.subtotal)} />
        <ThermalRow
          label={`Discount${sale.discountPercent ? ` (${sale.discountPercent}%)` : ""}`}
          value={
            Number(sale.discountAmount) > 0
              ? `-${formatMoneyCompact(sale.discountAmount)}`
              : formatMoneyCompact(0)
          }
        />
        {Number(sale.otherChargeAmount) > 0 ? (
          <ThermalRow
            label={sale.serviceType === "DELIVERY" ? "Delivery fee" : "Other"}
            value={formatMoneyCompact(sale.otherChargeAmount)}
          />
        ) : null}
        <ThermalRow
          label="Total"
          value={`Rs ${formatMoneyCompact(sale.grandTotal)}`}
          bold
          className="pt-0.5 text-[12px]"
        />
      </div>

      <ThermalPaymentBlock
        rows={paymentRows}
        footnote={
          Number(sale.cashPaidAmount) > 0 && Number(sale.bankPaidAmount) > 0
            ? "Both: cash + bank"
            : null
        }
      />

      {sale.paymentStatus && sale.paymentStatus !== "PAID" ? (
        <ThermalCreditBlock
          paymentStatus={sale.paymentStatus}
          paidAmount={sale.paidAmount}
          remainingAmount={sale.remainingAmount}
          dueDate={sale.dueDate}
          paymentTermsLabel={paymentTermsLabel(sale.paymentTermsPreset)}
          payments={sale.payments}
        />
      ) : null}

      {sale.notes?.trim() ? (
        <>
          <ThermalDivider />
          <p className="text-[10px] leading-snug">{sale.notes.trim()}</p>
        </>
      ) : null}

      <footer className="mt-3 border-t border-black pt-2 text-center">
        <p className="text-[11px] font-medium">Thank you — visit again</p>
      </footer>
    </ThermalReceiptShell>
  );
}

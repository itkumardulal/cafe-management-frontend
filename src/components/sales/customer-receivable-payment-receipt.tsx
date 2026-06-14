"use client";

import { formatSalePaymentMethod } from "@/src/lib/ar-display";
import { ThermalDivider } from "@/src/features/printing/components/thermal-divider";
import { ThermalLineItems } from "@/src/features/printing/components/thermal-line-items";
import { ThermalPaymentBlock } from "@/src/features/printing/components/thermal-payment-block";
import { ThermalReceiptHeader } from "@/src/features/printing/components/thermal-receipt-header";
import { ThermalReceiptMeta } from "@/src/features/printing/components/thermal-receipt-meta";
import { ThermalReceiptShell } from "@/src/features/printing/components/thermal-receipt-shell";
import { ThermalRow } from "@/src/features/printing/components/thermal-row";
import { formatMoneyCompact } from "@/src/features/printing/lib/thermal-money";
import { formatCompactDateTime, wrapThermalText } from "@/src/features/printing/lib/thermal-text";
import { DEFAULT_PAPER_PROFILE } from "@/src/features/printing/constants/paper-profiles";
import type { CustomerReceivablePaymentReceiptData } from "@/src/lib/ar-types";
import { cn } from "@/src/lib/cn";

type CustomerReceivablePaymentReceiptProps = {
  payment: CustomerReceivablePaymentReceiptData;
  cafeName?: string;
  className?: string;
  id?: string;
};

export function CustomerReceivablePaymentReceipt({
  payment,
  cafeName,
  className,
  id,
}: CustomerReceivablePaymentReceiptProps) {
  const name = cafeName ?? payment.cafe?.cafeName ?? "Cafe";
  const contact = payment.cafe?.contactNumber ?? payment.cafe?.email;
  const methodLabel = formatSalePaymentMethod(payment.paymentMethod);
  const amountReceived = payment.amountReceived ?? payment.amount;
  const changeAmount = Number(payment.changeAmount ?? 0);

  const paymentRows = [
    { label: "Method", value: methodLabel },
    payment.bankAccountLabel
      ? { label: "Bank account", value: payment.bankAccountLabel }
      : null,
    {
      label: "Amount received",
      value: `Rs ${formatMoneyCompact(amountReceived)}`,
    },
    {
      label: "Applied to bills",
      value: `Rs ${formatMoneyCompact(payment.amount)}`,
      bold: true,
    },
    changeAmount > 0.005
      ? {
          label: "Change returned",
          value: `Rs ${formatMoneyCompact(payment.changeAmount!)}`,
          bold: true,
        }
      : null,
  ].filter((row): row is { label: string; value: string; bold?: boolean } => row !== null);

  const addressLines = payment.customer.address
    ? wrapThermalText(payment.customer.address, DEFAULT_PAPER_PROFILE.maxChars)
    : [];

  return (
    <ThermalReceiptShell id={id} className={cn(className)}>
      <ThermalReceiptHeader
        cafeName={name}
        logoUrl={payment.cafe?.logo}
        address={payment.cafe?.address}
        contact={contact}
        title="Payment receipt"
        badge="AR SETTLEMENT"
      />

      <ThermalReceiptMeta
        items={[
          { label: "Receipt", value: payment.receiptNo },
          { label: "Date", value: formatCompactDateTime(payment.paidAt) },
          ...(payment.createdByName
            ? [{ label: "Recorded by", value: payment.createdByName }]
            : []),
        ]}
      />

      <ThermalDivider />

      <div className="text-[10px]">
        <p className="font-semibold uppercase tracking-wide">Customer</p>
        <p className="mt-0.5 font-medium">{payment.customer.name}</p>
        <p className="mt-0.5 font-mono">{payment.customer.phoneNumber}</p>
        {addressLines.map((line, idx) => (
          <p key={idx} className="mt-0.5 leading-snug">
            {line}
          </p>
        ))}
        {payment.customer.email ? (
          <p className="mt-0.5">{payment.customer.email}</p>
        ) : null}
      </div>

      {payment.allocations.length > 0 ? (
        <>
          <ThermalDivider />
          <ThermalLineItems
            variant="purchase"
            lines={payment.allocations.map((allocation) => ({
              name: allocation.receiptNo,
              detail: "Applied to invoice",
              lineTotal: allocation.amount,
            }))}
          />
        </>
      ) : null}

      <ThermalDivider />

      <div className="space-y-0.5 text-[10px]">
        <ThermalRow
          label="Applied to bills"
          value={`Rs ${formatMoneyCompact(payment.amount)}`}
          bold
          className="pt-0.5 text-[12px]"
        />
        {changeAmount > 0.005 ? (
          <ThermalRow
            label="Change returned"
            value={`Rs ${formatMoneyCompact(payment.changeAmount!)}`}
            bold
          />
        ) : null}
      </div>

      <ThermalPaymentBlock
        title="Payment details"
        rows={paymentRows}
        footnote="Settled oldest unpaid invoices first (FIFO)"
      />

      {payment.remarks?.trim() ? (
        <>
          <ThermalDivider />
          <div className="text-[10px]">
            <p className="font-semibold uppercase tracking-wide">Remarks</p>
            <p className="mt-0.5 leading-snug">{payment.remarks.trim()}</p>
          </div>
        </>
      ) : null}

      <footer className="mt-3 border-t border-black pt-2 text-center">
        <p className="text-[11px] font-medium">Thank you</p>
        <p className="mt-0.5 text-[9px]">Customer receivable payment record</p>
      </footer>
    </ThermalReceiptShell>
  );
}

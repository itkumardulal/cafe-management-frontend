"use client";

import { Badge } from "@/src/components/ui/badge";
import { ResponsiveTable } from "@/src/components/ui/table";
import { formatDateTime, formatMoney } from "@/src/lib/format-display";
import type { PosSaleReceiptData } from "@/src/components/sales/pos-sale-receipt";

function serviceLabel(type: PosSaleReceiptData["serviceType"]) {
  return type === "DELIVERY" ? "Delivery" : "Dine in";
}

function billingLabel(type: PosSaleReceiptData["billingType"]) {
  return type === "CREDIT" ? "Credit" : "Paid";
}

type PosSaleDetailProps = {
  sale: PosSaleReceiptData;
};

export function PosSaleDetail({ sale }: PosSaleDetailProps) {
  const hasCustomer =
    sale.customerName?.trim() ||
    sale.customerPhone?.trim() ||
    sale.customerAddress?.trim() ||
    sale.customerEmail?.trim();

  const creditNum = Number(sale.creditAmount);
  const hasCredit = Number.isFinite(creditNum) && creditNum > 0.005;
  const otherCharge = Number(sale.otherChargeAmount);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="default">{serviceLabel(sale.serviceType)}</Badge>
        <Badge variant={sale.billingType === "CREDIT" ? "warning" : "success"}>
          {billingLabel(sale.billingType)}
        </Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Receipt</p>
          <p className="mt-1 font-mono text-sm font-semibold text-foreground">{sale.receiptNo}</p>
          <p className="mt-0.5 text-xs text-muted">{formatDateTime(sale.saleAt)}</p>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Recorded</p>
          <p className="mt-1 text-sm font-medium text-foreground">
            {formatDateTime(sale.createdAt)}
          </p>
          {sale.createdByName ? (
            <p className="mt-0.5 text-xs text-muted">by {sale.createdByName}</p>
          ) : null}
        </div>
      </div>

      {hasCustomer ? (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-cream-50)]/50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Customer</p>
          {sale.customerName ? (
            <p className="mt-1 text-sm font-medium text-foreground">{sale.customerName}</p>
          ) : null}
          {sale.customerPhone ? (
            <p className="mt-0.5 text-sm text-muted">{sale.customerPhone}</p>
          ) : null}
          {sale.customerAddress ? (
            <p className="mt-1 text-sm text-muted">
              {sale.serviceType === "DELIVERY" ? "Deliver to: " : ""}
              {sale.customerAddress}
            </p>
          ) : null}
          {sale.customerEmail ? (
            <p className="mt-0.5 text-sm text-muted">{sale.customerEmail}</p>
          ) : null}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]">
        <div className="border-b border-[var(--color-border)] bg-[var(--color-cream-50)] px-4 py-3.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Line items</p>
          <p className="mt-0.5 text-xs text-muted">
            {sale.lineCount} {sale.lineCount === 1 ? "item" : "items"}
          </p>
        </div>
        <ResponsiveTable
          headers={[
            "Item",
            { label: "Qty", thClassName: "text-right" },
            { label: "Unit price", thClassName: "text-right" },
            { label: "Line total", thClassName: "text-right" },
          ]}
          ariaLabel="Sale line items"
          density="compact"
          className="border-0 shadow-none [&_table]:min-w-full"
        >
          {sale.lines.map((line, idx) => (
            <tr key={idx} className="border-t border-[var(--color-border)]">
              <td className="px-4 py-3 text-sm font-medium text-foreground">{line.menuItemName}</td>
              <td className="px-4 py-3 text-right text-sm tabular-nums text-muted">
                {formatMoney(line.quantity)}
              </td>
              <td className="px-4 py-3 text-right text-sm font-mono tabular-nums text-muted">
                {formatMoney(line.unitPrice)}
              </td>
              <td className="px-4 py-3 text-right text-sm font-mono font-medium tabular-nums text-foreground">
                {formatMoney(line.lineTotal)}
              </td>
            </tr>
          ))}
        </ResponsiveTable>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Totals</p>
          <dl className="mt-2 space-y-1.5 text-sm">
            <div className="flex justify-between gap-2 text-muted">
              <dt>Subtotal</dt>
              <dd className="font-mono tabular-nums">{formatMoney(sale.subtotal)}</dd>
            </div>
            {otherCharge > 0 ? (
              <div className="flex justify-between gap-2 text-muted">
                <dt>{sale.serviceType === "DELIVERY" ? "Delivery fee" : "Extra"}</dt>
                <dd className="font-mono tabular-nums">{formatMoney(sale.otherChargeAmount)}</dd>
              </div>
            ) : null}
            {Number(sale.discountAmount) > 0 ? (
              <div className="flex justify-between gap-2 text-muted">
                <dt>
                  Discount
                  {sale.discountPercent ? ` (${sale.discountPercent}%)` : ""}
                </dt>
                <dd className="font-mono tabular-nums">−{formatMoney(sale.discountAmount)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-2 border-t border-[var(--color-border)] pt-2 font-semibold text-foreground">
              <dt>Grand total</dt>
              <dd className="font-mono text-base tabular-nums text-[var(--color-primary)]">
                {formatMoney(sale.grandTotal)}
              </dd>
            </div>
          </dl>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Payment</p>
          <dl className="mt-2 space-y-1.5 text-sm">
            {Number(sale.cashPaidAmount) > 0 ? (
              <div className="flex justify-between gap-2 text-muted">
                <dt>Cash</dt>
                <dd className="font-mono tabular-nums">{formatMoney(sale.cashPaidAmount)}</dd>
              </div>
            ) : null}
            {Number(sale.bankPaidAmount) > 0 ? (
              <div className="flex justify-between gap-2 text-muted">
                <dt>Bank</dt>
                <dd className="font-mono tabular-nums">{formatMoney(sale.bankPaidAmount)}</dd>
              </div>
            ) : null}
            {hasCredit ? (
              <div className="flex justify-between gap-2 font-medium text-foreground">
                <dt>Credit due</dt>
                <dd className="font-mono tabular-nums">{formatMoney(sale.creditAmount)}</dd>
              </div>
            ) : null}
            {!Number(sale.cashPaidAmount) && !Number(sale.bankPaidAmount) && !hasCredit ? (
              <p className="text-muted">—</p>
            ) : null}
          </dl>
        </div>
      </div>

      {sale.notes?.trim() ? (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-cream-50)]/50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Notes</p>
          <p className="mt-1 text-sm text-foreground">{sale.notes.trim()}</p>
        </div>
      ) : null}
    </div>
  );
}

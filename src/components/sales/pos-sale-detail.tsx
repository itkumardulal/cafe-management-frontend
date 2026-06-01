"use client";

import { Badge } from "@/src/components/ui/badge";
import { DetailInfoCard } from "@/src/components/shared/detail-info-card";
import { DetailLineItemsSection } from "@/src/components/shared/detail-line-items-section";
import { LineItemCard } from "@/src/components/shared/line-item-card";
import { tableCenterCellClass, tableCenterColumnClass } from "@/src/components/ui/table";
import { formatDateTime, formatMoney } from "@/src/lib/format-display";
import { cn } from "@/src/lib/cn";
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
        {sale.serviceType === "DINE_IN" && sale.tableName ? (
          <Badge variant="default">Table: {sale.tableName}</Badge>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <DetailInfoCard label="Receipt">
          <p className="font-mono font-semibold">{sale.receiptNo}</p>
          <p className="mt-0.5 text-xs text-[var(--color-muted)]">{formatDateTime(sale.saleAt)}</p>
        </DetailInfoCard>
        <DetailInfoCard label="Recorded">
          <p className="font-medium">{formatDateTime(sale.createdAt)}</p>
          {sale.createdByName ? (
            <p className="mt-0.5 text-xs text-[var(--color-muted)]">by {sale.createdByName}</p>
          ) : null}
        </DetailInfoCard>
      </div>

      {hasCustomer ? (
        <DetailInfoCard label="Customer" muted>
          {sale.customerName ? <p className="font-medium">{sale.customerName}</p> : null}
          {sale.customerPhone ? (
            <p className={sale.customerName ? "mt-0.5 text-[var(--color-muted)]" : "font-medium"}>
              {sale.customerPhone}
            </p>
          ) : null}
          {sale.customerAddress ? (
            <p className="mt-1 text-[var(--color-muted)]">
              {sale.serviceType === "DELIVERY" ? "Deliver to: " : ""}
              {sale.customerAddress}
            </p>
          ) : null}
          {sale.customerEmail ? (
            <p className="mt-0.5 text-[var(--color-muted)]">{sale.customerEmail}</p>
          ) : null}
        </DetailInfoCard>
      ) : null}

      <DetailLineItemsSection
        subtitle={`${sale.lineCount} ${sale.lineCount === 1 ? "item" : "items"}`}
        headers={[
          "Item",
          { label: "Qty", thClassName: tableCenterColumnClass },
          { label: "Unit price", thClassName: tableCenterColumnClass },
          { label: "Line total", thClassName: tableCenterColumnClass },
        ]}
        ariaLabel="Sale line items"
        mobileLineItems={
          <>
            {sale.lines.map((line, idx) => (
              <LineItemCard
                key={idx}
                title={line.menuItemName}
                fields={[
                  { label: "Qty", value: formatMoney(line.quantity) },
                  { label: "Unit price", value: formatMoney(line.unitPrice) },
                  { label: "Line total", value: formatMoney(line.lineTotal) },
                ]}
              />
            ))}
          </>
        }
      >
        {sale.lines.map((line, idx) => (
          <tr key={idx} className="border-t border-[var(--color-border)] last:border-b-0">
            <td className="px-4 py-3 text-sm font-medium text-[var(--color-foreground)]">{line.menuItemName}</td>
            <td className={cn("px-4 py-3 text-sm tabular-nums text-[var(--color-muted)]", tableCenterCellClass)}>
              {formatMoney(line.quantity)}
            </td>
            <td className={cn("px-4 py-3 text-sm font-mono tabular-nums text-[var(--color-muted)]", tableCenterCellClass)}>
              {formatMoney(line.unitPrice)}
            </td>
            <td className={cn("px-4 py-3 text-sm font-mono font-medium tabular-nums text-[var(--color-foreground)]", tableCenterCellClass)}>
              {formatMoney(line.lineTotal)}
            </td>
          </tr>
        ))}
      </DetailLineItemsSection>

      <div className="grid gap-3 sm:grid-cols-2">
        <DetailInfoCard label="Totals">
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
        </DetailInfoCard>
        <DetailInfoCard label="Payment">
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
        </DetailInfoCard>
      </div>

      {sale.notes?.trim() ? (
        <DetailInfoCard label="Notes" muted>
          {sale.notes.trim()}
        </DetailInfoCard>
      ) : null}
    </div>
  );
}

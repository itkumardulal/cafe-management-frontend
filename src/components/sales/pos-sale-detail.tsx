"use client";

import { useState } from "react";
import { Badge } from "@/src/components/ui/badge";
import { DetailInfoCard } from "@/src/components/shared/detail-info-card";
import { DetailLineItemsSection } from "@/src/components/shared/detail-line-items-section";
import { LineItemCard } from "@/src/components/shared/line-item-card";
import {
  ResponsiveTable,
  tableCenterCellClass,
  tableCenterColumnClass,
} from "@/src/components/ui/table";
import {
  RecordSalePaymentSection,
  type SalePaymentMode,
} from "@/src/components/sales/record-sale-payment-section";
import type { PosSaleReceiptData } from "@/src/components/sales/pos-sale-receipt";
import { getApiErrorMessage } from "@/src/lib/api-error";
import type { SalePaymentMethod } from "@/src/lib/ar-types";
import {
  formatSalePaymentMethod,
  saleBillStatusLabel,
  salePaymentStatusLabel,
} from "@/src/lib/ar-display";
import { cn } from "@/src/lib/cn";
import { formatDateOnly, formatDateTime, formatMoney } from "@/src/lib/format-display";
import { parseMoneyInput, roundMoneyStr } from "@/src/lib/money-input";
import { appToast } from "@/src/lib/toast";
import { operationsApi } from "@/src/services/operations-api";

function serviceLabel(type: PosSaleReceiptData["serviceType"]) {
  return type === "DELIVERY" ? "Delivery" : "Dine in";
}

type PosSaleDetailProps = {
  sale: PosSaleReceiptData;
  onSaleUpdated?: (sale: PosSaleReceiptData) => void;
};

export function PosSaleDetail({ sale, onSaleUpdated }: PosSaleDetailProps) {
  const [payMode, setPayMode] = useState<SalePaymentMode>("FULL");
  const [amountStr, setAmountStr] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<SalePaymentMethod>("CASH");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [chequeBankName, setChequeBankName] = useState("");
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);

  const remaining = Number(sale.remainingAmount ?? sale.creditAmount);
  const hasBalance = Number.isFinite(remaining) && remaining > 0.005;
  const otherCharge = Number(sale.otherChargeAmount);
  const amountReceived =
    Number(sale.cashPaidAmount ?? 0) + Number(sale.bankPaidAmount ?? 0);

  const recordPayment = async () => {
    if (!sale.id) return;
    const roundedRemaining = Math.round(remaining * 100) / 100;
    const parsed = parseMoneyInput(amountStr);
    const amount =
      payMode === "FULL"
        ? roundedRemaining
        : parsed.invalid
          ? 0
          : parsed.amount;
    if (amount <= 0) {
      appToast.error("Enter a valid payment amount");
      return;
    }
    setSaving(true);
    try {
      await operationsApi.sales.recordPayment(sale.id, {
        amount,
        paymentMethod,
        referenceNumber: referenceNumber.trim() || undefined,
        chequeBankName:
          paymentMethod === "CHEQUE" ? chequeBankName.trim() : undefined,
        remarks: remarks.trim() || undefined,
      });
      const updated = await operationsApi.sales.getOne(sale.id);
      onSaleUpdated?.(updated as PosSaleReceiptData);
      appToast.success("Payment recorded");
      setAmountStr("");
      setRemarks("");
      setReferenceNumber("");
      setChequeBankName("");
      setPayMode("FULL");
    } catch (error) {
      appToast.error(getApiErrorMessage(error, "Failed to record payment"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="default">{serviceLabel(sale.serviceType)}</Badge>
        <Badge
          variant={
            sale.paymentStatus === "PAID"
              ? "success"
              : sale.paymentStatus === "PARTIAL"
                ? "warning"
                : "danger"
          }
        >
          {sale.paymentStatus ? salePaymentStatusLabel(sale.paymentStatus) : "—"}
        </Badge>
        {sale.billStatus ? (
          <Badge variant={sale.billStatus === "OVERDUE" ? "danger" : "default"}>
            {saleBillStatusLabel(sale.billStatus)}
          </Badge>
        ) : null}
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

      {(sale.customerName || sale.customerPhone) && (
        <DetailInfoCard label="Customer" muted>
          {sale.customerName ? <p className="font-medium">{sale.customerName}</p> : null}
          {sale.customerPhone ? (
            <p className="text-[var(--color-muted)]">{sale.customerPhone}</p>
          ) : null}
          {sale.customerAddress ? (
            <p className="mt-1 text-[var(--color-muted)]">{sale.customerAddress}</p>
          ) : null}
        </DetailInfoCard>
      )}

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
            {sale.lines.map((line) => (
              <LineItemCard
                key={line.id}
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
        {sale.lines.map((line) => (
          <tr key={line.id} className="border-t border-[var(--color-border)]">
            <td className="px-4 py-3 text-sm font-medium">{line.menuItemName}</td>
            <td className={cn("px-4 py-3 text-sm tabular-nums text-muted", tableCenterCellClass)}>
              {formatMoney(line.quantity)}
            </td>
            <td className={cn("px-4 py-3 font-mono text-sm tabular-nums text-muted", tableCenterCellClass)}>
              {formatMoney(line.unitPrice)}
            </td>
            <td className={cn("px-4 py-3 font-mono text-sm font-medium tabular-nums", tableCenterCellClass)}>
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
                <dt>Extra</dt>
                <dd className="font-mono tabular-nums">{formatMoney(sale.otherChargeAmount)}</dd>
              </div>
            ) : null}
            {Number(sale.discountAmount) > 0 ? (
              <div className="flex justify-between gap-2 text-muted">
                <dt>Discount</dt>
                <dd className="font-mono tabular-nums">−{formatMoney(sale.discountAmount)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-2 border-t border-[var(--color-border)] pt-2 font-semibold">
              <dt>Grand total</dt>
              <dd className="font-mono text-base tabular-nums text-[var(--color-primary)]">
                {formatMoney(sale.grandTotal)}
              </dd>
            </div>
          </dl>
        </DetailInfoCard>
        <DetailInfoCard label="Payment summary">
          <dl className="mt-2 space-y-1.5 text-sm">
            <div className="flex justify-between gap-2 text-muted">
              <dt>Amount received</dt>
              <dd className="font-mono tabular-nums text-emerald-700">
                {formatMoney(amountReceived)}
              </dd>
            </div>
            <div className="flex justify-between gap-2 text-muted">
              <dt>Applied to bill</dt>
              <dd className="font-mono tabular-nums">
                {formatMoney(sale.paidAmount ?? sale.grandTotal)}
              </dd>
            </div>
            {Number(sale.changeAmount ?? 0) > 0 ? (
              <div className="flex justify-between gap-2 text-muted">
                <dt>Change returned</dt>
                <dd className="font-mono tabular-nums text-sky-700">
                  {formatMoney(sale.changeAmount)}
                </dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-2 font-medium">
              <dt>On credit</dt>
              <dd className="font-mono tabular-nums text-amber-800">
                {formatMoney(sale.remainingAmount ?? sale.creditAmount)}
              </dd>
            </div>
            {sale.dueDate ? (
              <div className="flex justify-between gap-2 text-muted">
                <dt>Due date</dt>
                <dd>{formatDateOnly(sale.dueDate)}</dd>
              </div>
            ) : null}
          </dl>
        </DetailInfoCard>
      </div>

      {sale.payments && sale.payments.length > 0 ? (
        <DetailInfoCard label="Payment history">
          <ResponsiveTable
            className="mt-2"
            headers={["Date", "Receipt", "Method", { label: "Amount", thClassName: "text-right" }]}
            ariaLabel="Payment history"
          >
            {sale.payments.map((p) => (
              <tr key={p.id} className="border-t border-[var(--color-border)] text-sm">
                <td className="px-4 py-3">{formatDateOnly(p.paymentDate)}</td>
                <td className="px-4 py-3 font-mono text-xs">{p.receiptNo}</td>
                <td className="px-4 py-3">
                  {formatSalePaymentMethod(p.paymentMethod)}
                  {p.chequeBankName ? ` · ${p.chequeBankName}` : ""}
                  {p.referenceNumber ? ` #${p.referenceNumber}` : ""}
                </td>
                <td className="px-4 py-3 text-right font-mono tabular-nums">
                  {formatMoney(p.amount)}
                </td>
              </tr>
            ))}
          </ResponsiveTable>
        </DetailInfoCard>
      ) : null}

      {hasBalance && sale.id ? (
        <RecordSalePaymentSection
          remainingBalance={remaining}
          mode={payMode}
          onModeChange={(m) => {
            setPayMode(m);
            if (m === "FULL") {
              setAmountStr(roundMoneyStr(remaining));
            } else {
              setAmountStr("");
            }
          }}
          amountStr={amountStr}
          onAmountStrChange={setAmountStr}
          paymentMethod={paymentMethod}
          onPaymentMethodChange={setPaymentMethod}
          referenceNumber={referenceNumber}
          onReferenceNumberChange={setReferenceNumber}
          chequeBankName={chequeBankName}
          onChequeBankNameChange={setChequeBankName}
          remarks={remarks}
          onRemarksChange={setRemarks}
          onSubmit={() => void recordPayment()}
          saving={saving}
        />
      ) : null}

      {sale.notes?.trim() ? (
        <DetailInfoCard label="Notes" muted>
          {sale.notes.trim()}
        </DetailInfoCard>
      ) : null}
    </div>
  );
}

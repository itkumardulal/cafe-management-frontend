"use client";

import { formatDateOnly, formatDateTime, formatMoney } from "@/src/lib/format-display";
import { cn } from "@/src/lib/cn";
import {
  getPurchasePaymentStatus,
  purchasePaymentStatusLabel,
  type PurchaseBillingType,
} from "@/src/lib/money-input";
import type { PurchasePaymentStatus } from "@/src/lib/ap-types";

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

export function DirectPurchaseReceipt({
  purchase,
  cafeName,
  className,
  id,
}: DirectPurchaseReceiptProps) {
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

  return (
    <article
      id={id}
      className={cn(
        "direct-purchase-receipt mx-auto w-full max-w-[22rem] bg-white px-5 py-6 text-stone-900",
        "font-[family-name:var(--font-geist-sans,ui-sans-serif,system-ui,sans-serif)]",
        className,
      )}
    >
      <header className="text-center">
        <div className="mx-auto mb-3 h-px w-16 bg-stone-800" aria-hidden />
        <h1 className="font-serif text-xl font-semibold tracking-tight text-stone-900">{name}</h1>
        {purchase.cafe?.address ? (
          <p className="mt-1 text-[11px] leading-relaxed text-stone-600">{purchase.cafe.address}</p>
        ) : null}
        {contact ? (
          <p className="mt-0.5 text-[11px] text-stone-500">{contact}</p>
        ) : null}
        <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">
          Direct purchase
        </p>
        <div className="mx-auto mt-3 h-px w-full border-t border-dashed border-stone-400" aria-hidden />
      </header>

      <dl className="mt-4 space-y-1.5 text-[11px]">
        <div className="flex justify-between gap-3">
          <dt className="text-stone-500">Receipt no.</dt>
          <dd className="font-mono font-semibold text-stone-900">{purchase.receiptNo}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-stone-500">Purchase date</dt>
          <dd className="font-medium text-stone-800">{formatDateOnly(purchase.purchaseDate)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-stone-500">Recorded</dt>
          <dd className="text-right font-medium text-stone-800">{formatDateTime(purchase.createdAt)}</dd>
        </div>
        {purchase.createdByName ? (
          <div className="flex justify-between gap-3">
            <dt className="text-stone-500">Recorded by</dt>
            <dd className="font-medium text-stone-800">{purchase.createdByName}</dd>
          </div>
        ) : null}
      </dl>

      <div className="my-4 h-px w-full border-t border-dashed border-stone-400" aria-hidden />

      <table className="w-full border-collapse text-[11px]">
        <thead>
          <tr className="border-b border-stone-300 text-[10px] uppercase tracking-wide text-stone-500">
            <th className="pb-2 text-left font-semibold">Item</th>
            <th className="pb-2 text-right font-semibold">Qty</th>
            <th className="pb-2 text-right font-semibold">Amount</th>
          </tr>
        </thead>
        <tbody>
          {purchase.lines.map((line, idx) => (
            <tr key={idx} className="border-b border-stone-200 align-top">
              <td className="py-2.5 pr-2">
                <p className="font-medium text-stone-900">{line.item.name}</p>
                <p className="mt-0.5 text-[10px] text-stone-500">{line.supplier.name}</p>
                {formatItemUnit(line.item) ? (
                  <p className="mt-0.5 font-mono text-[10px] text-stone-500">
                    @ {formatMoney(line.ratePerUnit)} / {formatItemUnit(line.item)}
                  </p>
                ) : (
                  <p className="mt-0.5 font-mono text-[10px] text-stone-500">
                    @ {formatMoney(line.ratePerUnit)}
                  </p>
                )}
              </td>
              <td className="py-2.5 text-right font-mono tabular-nums text-stone-800">
                {formatMoney(line.quantity)}
              </td>
              <td className="py-2.5 text-right font-mono font-semibold tabular-nums text-stone-900">
                {formatMoney(line.lineTotal)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="my-4 h-px w-full border-t border-dashed border-stone-400" aria-hidden />

      <div className="space-y-1 text-[11px]">
        <div className="flex justify-between text-stone-600">
          <span>Line items</span>
          <span className="font-mono tabular-nums">{purchase.lineCount}</span>
        </div>
        <div className="flex items-baseline justify-between gap-3 pt-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-stone-700">
            Grand total
          </span>
          <span className="font-mono text-xl font-bold tabular-nums text-stone-900">
            {formatMoney(purchase.grandTotal)}
          </span>
        </div>
      </div>

      {hasPaymentBreakdown ? (
        <>
          <div className="my-4 h-px w-full border-t border-dashed border-stone-400" aria-hidden />
          <div className="space-y-1 text-[11px]">
            <p className="font-semibold uppercase tracking-wide text-stone-500">Payment</p>
            <p className="text-stone-600">{purchasePaymentStatusLabel(paymentStatus)}</p>
            {cash > 0.005 ? (
              <div className="flex justify-between text-stone-600">
                <span>Cash paid</span>
                <span className="font-mono tabular-nums">{formatMoney(cash)}</span>
              </div>
            ) : null}
            {bank > 0.005 ? (
              <div className="flex justify-between text-stone-600">
                <span>Bank paid</span>
                <span className="font-mono tabular-nums">{formatMoney(bank)}</span>
              </div>
            ) : null}
            {credit > 0.005 ? (
              <div className="flex justify-between font-medium text-stone-800">
                <span>Credit due</span>
                <span className="font-mono tabular-nums">{formatMoney(credit)}</span>
              </div>
            ) : null}
            {bank > 0.005 && purchase.bankPaymentScreenshotUrl ? (
              <p className="pt-1 text-[10px] text-stone-500">Bank transfer proof on file</p>
            ) : null}
          </div>
        </>
      ) : null}

      {purchase.notes?.trim() ? (
        <>
          <div className="my-4 h-px w-full border-t border-dashed border-stone-400" aria-hidden />
          <div className="text-[11px]">
            <p className="font-semibold uppercase tracking-wide text-stone-500">Notes</p>
            <p className="mt-1 leading-relaxed text-stone-700">{purchase.notes.trim()}</p>
          </div>
        </>
      ) : null}

      <footer className="mt-6 border-t border-stone-300 pt-4 text-center">
        <p className="text-[11px] font-medium text-stone-700">Thank you</p>
        <p className="mt-1 text-[10px] text-stone-500">Stock purchase — updates inventory</p>
      </footer>
    </article>
  );
}

"use client";

import { formatDateTime, formatMoney } from "@/src/lib/format-display";
import { cn } from "@/src/lib/cn";

export type PosSaleReceiptLine = {
  menuItemName: string;
  quantity: string;
  unitPrice: string;
  lineTotal: string;
};

export type PosSaleReceiptData = {
  id?: string;
  receiptNo: string;
  saleAt: string;
  createdAt: string;
  serviceType: "DINE_IN" | "DELIVERY";
  billingType: "PAID" | "CREDIT";
  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  customerAddress?: string | null;
  subtotal: string;
  otherChargeAmount: string;
  discountAmount: string;
  discountPercent?: string | null;
  grandTotal: string;
  cashPaidAmount: string;
  bankPaidAmount: string;
  creditAmount: string;
  notes?: string | null;
  createdByName?: string | null;
  lineCount: number;
  lines: PosSaleReceiptLine[];
  cafe?: {
    cafeName: string;
    address?: string | null;
    contactNumber?: string | null;
    email?: string;
  } | null;
};

function serviceLabel(type: PosSaleReceiptData["serviceType"]) {
  return type === "DELIVERY" ? "Delivery" : "Dine in";
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
    sale.customerAddress?.trim();

  const creditNum = Number(sale.creditAmount);
  const hasCredit = Number.isFinite(creditNum) && creditNum > 0.005;

  return (
    <article
      id={id}
      className={cn(
        "pos-sale-receipt mx-auto w-full max-w-[72mm] bg-white px-4 py-5 text-stone-900",
        "font-[family-name:var(--font-geist-sans,ui-sans-serif,system-ui,sans-serif)]",
        className,
      )}
    >
      <header className="text-center">
        <div className="mx-auto mb-2 h-px w-12 bg-stone-800" aria-hidden />
        <h1 className="text-lg font-semibold tracking-tight text-stone-900">{name}</h1>
        {sale.cafe?.address ? (
          <p className="mt-1 text-[10px] leading-relaxed text-stone-600">{sale.cafe.address}</p>
        ) : null}
        {contact ? <p className="mt-0.5 text-[10px] text-stone-500">{contact}</p> : null}
        <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.15em] text-stone-700">
          Sales receipt
        </p>
        <p className="mt-1 inline-block rounded border border-stone-400 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-stone-800">
          {serviceLabel(sale.serviceType)}
        </p>
        <div className="mx-auto mt-2 h-px w-full border-t border-dashed border-stone-400" aria-hidden />
      </header>

      <dl className="mt-3 space-y-1 text-[10px]">
        <div className="flex justify-between gap-2">
          <dt className="text-stone-500">Receipt</dt>
          <dd className="font-mono font-semibold">{sale.receiptNo}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-stone-500">Date</dt>
          <dd className="font-medium">{formatDateTime(sale.saleAt)}</dd>
        </div>
        {sale.createdByName ? (
          <div className="flex justify-between gap-2">
            <dt className="text-stone-500">Cashier</dt>
            <dd className="font-medium">{sale.createdByName}</dd>
          </div>
        ) : null}
      </dl>

      {hasCustomer ? (
        <>
          <div className="my-3 h-px border-t border-dashed border-stone-400" aria-hidden />
          <div className="text-[10px]">
            <p className="font-semibold uppercase tracking-wide text-stone-500">Customer</p>
            {sale.customerName ? (
              <p className="mt-1 font-medium text-stone-900">{sale.customerName}</p>
            ) : null}
            {sale.customerPhone ? (
              <p className="mt-0.5 font-mono text-stone-700">{sale.customerPhone}</p>
            ) : null}
            {sale.customerAddress ? (
              <p className="mt-1 leading-relaxed text-stone-700">
                {sale.serviceType === "DELIVERY" ? "Deliver to: " : ""}
                {sale.customerAddress}
              </p>
            ) : null}
            {sale.customerEmail ? (
              <p className="mt-0.5 text-stone-600">{sale.customerEmail}</p>
            ) : null}
          </div>
        </>
      ) : null}

      <div className="my-3 h-px border-t border-dashed border-stone-400" aria-hidden />

      <table className="w-full border-collapse text-[10px]">
        <thead>
          <tr className="border-b border-stone-300 text-[9px] uppercase text-stone-500">
            <th className="pb-1.5 text-left font-semibold">Item</th>
            <th className="pb-1.5 text-right font-semibold">Amt</th>
          </tr>
        </thead>
        <tbody>
          {sale.lines.map((line, idx) => (
            <tr key={idx} className="border-b border-stone-200 align-top">
              <td className="py-2 pr-1">
                <p className="font-medium text-stone-900">{line.menuItemName}</p>
                <p className="mt-0.5 font-mono text-[9px] text-stone-500">
                  {formatMoney(line.quantity)} × {formatMoney(line.unitPrice)}
                </p>
              </td>
              <td className="py-2 text-right font-mono font-semibold tabular-nums">
                {formatMoney(line.lineTotal)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="my-3 h-px border-t border-dashed border-stone-400" aria-hidden />

      <div className="space-y-0.5 text-[10px]">
        <div className="flex justify-between text-stone-600">
          <span>Subtotal</span>
          <span className="font-mono tabular-nums">{formatMoney(sale.subtotal)}</span>
        </div>
        {Number(sale.otherChargeAmount) > 0 ? (
          <div className="flex justify-between text-stone-600">
            <span>{sale.serviceType === "DELIVERY" ? "Delivery fee" : "Other"}</span>
            <span className="font-mono tabular-nums">{formatMoney(sale.otherChargeAmount)}</span>
          </div>
        ) : null}
        {Number(sale.discountAmount) > 0 ? (
          <div className="flex justify-between text-stone-600">
            <span>
              Discount
              {sale.discountPercent ? ` (${sale.discountPercent}%)` : ""}
            </span>
            <span className="font-mono tabular-nums">−{formatMoney(sale.discountAmount)}</span>
          </div>
        ) : null}
        <div className="flex justify-between pt-1 font-semibold text-stone-900">
          <span>Total</span>
          <span className="font-mono text-sm tabular-nums">{formatMoney(sale.grandTotal)}</span>
        </div>
      </div>

      <div className="my-3 h-px border-t border-dashed border-stone-400" aria-hidden />

      <div className="space-y-0.5 text-[10px]">
        <p className="font-semibold uppercase tracking-wide text-stone-500">Payment</p>
        {Number(sale.cashPaidAmount) > 0 ? (
          <div className="flex justify-between">
            <span>Cash</span>
            <span className="font-mono tabular-nums">{formatMoney(sale.cashPaidAmount)}</span>
          </div>
        ) : null}
        {Number(sale.bankPaidAmount) > 0 ? (
          <div className="flex justify-between">
            <span>Bank</span>
            <span className="font-mono tabular-nums">{formatMoney(sale.bankPaidAmount)}</span>
          </div>
        ) : null}
        {hasCredit ? (
          <div className="flex justify-between font-semibold text-stone-900">
            <span>Credit due</span>
            <span className="font-mono tabular-nums">{formatMoney(sale.creditAmount)}</span>
          </div>
        ) : null}
        {Number(sale.cashPaidAmount) > 0 && Number(sale.bankPaidAmount) > 0 ? (
          <p className="pt-0.5 text-[9px] text-stone-500">Both: cash + bank</p>
        ) : null}
      </div>

      {sale.notes?.trim() ? (
        <>
          <div className="my-3 h-px border-t border-dashed border-stone-400" aria-hidden />
          <p className="text-[10px] text-stone-700">{sale.notes.trim()}</p>
        </>
      ) : null}

      <footer className="mt-4 border-t border-stone-300 pt-3 text-center">
        <p className="text-[11px] font-medium text-stone-800">Thank you — visit again</p>
      </footer>
    </article>
  );
}

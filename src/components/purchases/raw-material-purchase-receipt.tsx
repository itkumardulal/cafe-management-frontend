"use client";

import { formatDateOnly, formatDateTime, formatMoney } from "@/src/lib/format-display";
import { cn } from "@/src/lib/cn";

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
  grandTotal: string;
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

export function RawMaterialPurchaseReceipt({
  purchase,
  cafeName,
  className,
  id,
}: RawMaterialPurchaseReceiptProps) {
  const name = cafeName ?? purchase.cafe?.cafeName ?? "Cafe";
  const contact = purchase.cafe?.contactNumber ?? purchase.cafe?.email;

  return (
    <article
      id={id}
      className={cn(
        "rm-purchase-receipt mx-auto w-full max-w-[22rem] bg-white px-5 py-6 text-stone-900",
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
          Raw material purchase
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
                <p className="font-medium text-stone-900">{line.rawMaterialItem.name}</p>
                <p className="mt-0.5 text-[10px] text-stone-500">{line.supplier.name}</p>
                <p className="mt-0.5 font-mono text-[10px] text-stone-500">
                  @ {formatMoney(line.ratePerUnit)} / {line.rawMaterialItem.unit}
                </p>
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
        <p className="mt-1 text-[10px] text-stone-500">Expense record — does not update stock</p>
      </footer>
    </article>
  );
}

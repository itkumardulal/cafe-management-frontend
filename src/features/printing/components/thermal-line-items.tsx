"use client";

import {
  DEFAULT_PAPER_PROFILE,
  type PaperProfile,
} from "@/src/features/printing/constants/paper-profiles";
import { formatMoneyCompact } from "@/src/features/printing/lib/thermal-money";
import { truncateThermalText } from "@/src/features/printing/lib/thermal-text";

export type ThermalSaleLineItem = {
  name: string;
  quantity: string;
  unitPrice: string;
  lineTotal: string;
};

export type ThermalPurchaseLineItem = {
  name: string;
  subline?: string | null;
  detail?: string | null;
  quantity?: string | null;
  lineTotal: string;
};

type ThermalLineItemsProps =
  | {
      variant: "sale";
      lines: ThermalSaleLineItem[];
      paperProfile?: PaperProfile;
    }
  | {
      variant: "purchase";
      lines: ThermalPurchaseLineItem[];
      paperProfile?: PaperProfile;
    }
  | {
      variant: "kot";
      lines: Array<{ name: string; quantity: string; notes?: string | null }>;
      paperProfile?: PaperProfile;
    };

export function ThermalLineItems(props: ThermalLineItemsProps) {
  const paperProfile = props.paperProfile ?? DEFAULT_PAPER_PROFILE;

  if (props.variant === "kot") {
    const itemMaxChars = Math.max(12, paperProfile.maxChars - 10);

    return (
      <table className="w-full table-fixed border-collapse text-[10px]">
        <colgroup>
          <col />
          <col className="w-[18%]" />
        </colgroup>
        <thead>
          <tr className="border-b border-black text-[8px] uppercase">
            <th className="pb-1 text-left font-semibold">Item</th>
            <th className="pb-1 text-right font-semibold">Qty</th>
          </tr>
        </thead>
        <tbody>
          {props.lines.map((line, idx) => (
            <tr key={idx} className="align-top">
              <td className="py-1 pr-1 font-medium leading-snug break-words">
                {truncateThermalText(line.name, itemMaxChars)}
                {line.notes?.trim() ? (
                  <p className="mt-0.5 text-[8px] font-normal leading-snug text-black/75">
                    Note: {truncateThermalText(line.notes.trim(), itemMaxChars)}
                  </p>
                ) : null}
              </td>
              <td className="py-1 text-right font-mono text-[11px] font-semibold tabular-nums whitespace-nowrap">
                {formatMoneyCompact(line.quantity)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (props.variant === "sale") {
    const itemMaxChars = Math.max(12, paperProfile.maxChars - 22);

    return (
      <table className="w-full table-fixed border-collapse text-[10px]">
        <colgroup>
          <col />
          <col className="w-[12%]" />
          <col className="w-[26%]" />
          <col className="w-[26%]" />
        </colgroup>
        <thead>
          <tr className="border-b border-black text-[8px] uppercase">
            <th className="pb-1 text-left font-semibold">Item</th>
            <th className="pb-1 pr-0.5 text-right font-semibold">Qty</th>
            <th className="pb-1 pr-0.5 text-right font-semibold">Rate</th>
            <th className="pb-1 text-right font-semibold">Total</th>
          </tr>
        </thead>
        <tbody>
          {props.lines.map((line, idx) => (
            <tr key={idx} className="align-top">
              <td className="py-1 pr-1 font-medium leading-snug break-words">
                {truncateThermalText(line.name, itemMaxChars)}
              </td>
              <td className="py-1 pr-0.5 text-right font-mono tabular-nums whitespace-nowrap">
                {formatMoneyCompact(line.quantity)}
              </td>
              <td className="py-1 pr-0.5 text-right font-mono tabular-nums whitespace-nowrap">
                {formatMoneyCompact(line.unitPrice)}
              </td>
              <td className="py-1 text-right font-mono font-semibold tabular-nums whitespace-nowrap">
                {formatMoneyCompact(line.lineTotal)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <table className="w-full border-collapse text-[10px]">
      <thead>
        <tr className="border-b border-black text-[9px] uppercase">
          <th className="pb-1 text-left font-semibold">Item</th>
          <th className="pb-1 text-right font-semibold">Amt</th>
        </tr>
      </thead>
      <tbody>
        {props.lines.map((line, idx) => (
          <tr key={idx} className="align-top">
            <td className="py-1 pr-1">
              <p className="font-medium leading-snug">
                {truncateThermalText(line.name, paperProfile.maxChars - 8)}
              </p>
              {line.subline ? (
                <p className="mt-0.5 text-[9px]">{line.subline}</p>
              ) : null}
              {line.detail ? (
                <p className="mt-0.5 font-mono text-[9px]">{line.detail}</p>
              ) : null}
              {line.quantity ? (
                <p className="mt-0.5 font-mono text-[9px]">Qty {formatMoneyCompact(line.quantity)}</p>
              ) : null}
            </td>
            <td className="py-1 text-right font-mono font-semibold tabular-nums">
              {formatMoneyCompact(line.lineTotal)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

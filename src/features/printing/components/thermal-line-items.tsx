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
    };

export function ThermalLineItems(props: ThermalLineItemsProps) {
  const paperProfile = props.paperProfile ?? DEFAULT_PAPER_PROFILE;

  if (props.variant === "sale") {
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
                <p className="mt-0.5 font-mono text-[9px]">
                  {formatMoneyCompact(line.quantity)} x {formatMoneyCompact(line.unitPrice)}
                </p>
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

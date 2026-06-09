"use client";

import {
  DEFAULT_PAPER_PROFILE,
  type PaperProfile,
} from "@/src/features/printing/constants/paper-profiles";
import { wrapThermalText } from "@/src/features/printing/lib/thermal-text";
import { ThermalDivider } from "@/src/features/printing/components/thermal-divider";

type ThermalReceiptHeaderProps = {
  cafeName: string;
  address?: string | null;
  contact?: string | null;
  title: string;
  subtitle?: string | null;
  badge?: string | null;
  paperProfile?: PaperProfile;
};

export function ThermalReceiptHeader({
  cafeName,
  address,
  contact,
  title,
  subtitle,
  badge,
  paperProfile = DEFAULT_PAPER_PROFILE,
}: ThermalReceiptHeaderProps) {
  const addressLines = address ? wrapThermalText(address, paperProfile.maxChars) : [];

  return (
    <header className="text-center">
      <h1 className="text-[15px] font-bold leading-tight">{cafeName}</h1>
      {addressLines.map((line, idx) => (
        <p key={idx} className="mt-0.5 text-[10px] leading-snug">
          {line}
        </p>
      ))}
      {contact ? <p className="mt-0.5 text-[10px]">{contact}</p> : null}
      <p className="mt-2 text-[10px] font-bold uppercase tracking-widest">{title}</p>
      {badge ? (
        <p className="mt-1 text-[10px] font-bold uppercase tracking-wide">{badge}</p>
      ) : null}
      {subtitle ? <p className="mt-1 text-[10px] font-medium">{subtitle}</p> : null}
      <ThermalDivider />
    </header>
  );
}

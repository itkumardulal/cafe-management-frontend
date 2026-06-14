"use client";

import {
  DEFAULT_PAPER_PROFILE,
  type PaperProfile,
} from "@/src/features/printing/constants/paper-profiles";
import { wrapThermalText } from "@/src/features/printing/lib/thermal-text";
import { ThermalDivider } from "@/src/features/printing/components/thermal-divider";
import { ThermalReceiptLogo } from "@/src/features/printing/components/thermal-receipt-logo";
import { useAppSelector } from "@/src/store/hooks";
import { cn } from "@/src/lib/cn";

type ThermalReceiptHeaderProps = {
  cafeName: string;
  logoUrl?: string | null;
  address?: string | null;
  contact?: string | null;
  title: string;
  /** Shown on the left below the receipt title (e.g. service type). */
  badge?: string | null;
  /** Shown on the right below the receipt title (e.g. table). */
  subtitle?: string | null;
  paperProfile?: PaperProfile;
};

function CafeDetails({
  cafeName,
  addressLines,
  contact,
  align = "center",
}: {
  cafeName: string;
  addressLines: string[];
  contact?: string | null;
  align?: "left" | "center";
}) {
  const textAlign = align === "left" ? "text-left" : "text-center";

  return (
    <div className={cn("min-w-0", textAlign)}>
      <h1 className="text-[13px] font-bold leading-tight tracking-tight">{cafeName}</h1>
      {addressLines.map((line, idx) => (
        <p key={idx} className="mt-0.5 text-[9px] leading-snug text-black/80">
          {line}
        </p>
      ))}
      {contact ? (
        <p className="mt-0.5 font-mono text-[9px] tabular-nums text-black/80">{contact}</p>
      ) : null}
    </div>
  );
}

export function ThermalReceiptHeader({
  cafeName,
  logoUrl,
  address,
  contact,
  title,
  subtitle,
  badge,
  paperProfile = DEFAULT_PAPER_PROFILE,
}: ThermalReceiptHeaderProps) {
  const authLogo = useAppSelector((state) => state.auth.user?.cafe?.logo);
  const resolvedLogo = logoUrl ?? authLogo ?? null;
  const hasLogo = Boolean(resolvedLogo?.trim());
  const addressLines = address
    ? wrapThermalText(
        address,
        hasLogo ? Math.max(16, paperProfile.maxChars - 14) : paperProfile.maxChars,
      )
    : [];
  const hasMetaRow = Boolean(badge?.trim() || subtitle?.trim());

  return (
    <header className="thermal-receipt-header">
      {hasLogo ? (
        <div className="thermal-receipt-brand flex items-center gap-2.5 pb-2">
          <ThermalReceiptLogo
            logoUrl={resolvedLogo}
            cafeName={cafeName}
            className="h-11 w-11"
          />
          <CafeDetails
            cafeName={cafeName}
            addressLines={addressLines}
            contact={contact}
            align="left"
          />
        </div>
      ) : (
        <div className="pb-2">
          <CafeDetails
            cafeName={cafeName}
            addressLines={addressLines}
            contact={contact}
            align="center"
          />
        </div>
      )}

      <div className="border-y border-black py-1.5 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em]">{title}</p>
      </div>

      {hasMetaRow ? (
        <div className="thermal-receipt-meta-row mt-1.5 flex items-baseline justify-between gap-3">
          {badge?.trim() ? (
            <span className="text-left text-[10px] font-bold uppercase tracking-wide">
              {badge.trim()}
            </span>
          ) : (
            <span aria-hidden />
          )}
          {subtitle?.trim() ? (
            <span className="ml-auto text-right text-[10px] font-medium">{subtitle.trim()}</span>
          ) : null}
        </div>
      ) : null}

      <ThermalDivider />
    </header>
  );
}

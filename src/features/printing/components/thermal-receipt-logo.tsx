"use client";

import { cn } from "@/src/lib/cn";

type ThermalReceiptLogoProps = {
  logoUrl?: string | null;
  cafeName: string;
  className?: string;
};

export function ThermalReceiptLogo({ logoUrl, cafeName, className }: ThermalReceiptLogoProps) {
  const src = logoUrl?.trim();
  if (!src) return null;

  return (
    <img
      src={src}
      alt={`${cafeName} logo`}
      className={cn("thermal-receipt-logo shrink-0 object-contain", className)}
      loading="eager"
      decoding="sync"
    />
  );
}

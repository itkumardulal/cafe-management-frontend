"use client";

import type { ReactNode } from "react";
import {
  DEFAULT_PAPER_PROFILE,
  type PaperProfile,
} from "@/src/features/printing/constants/paper-profiles";
import { cn } from "@/src/lib/cn";

type ThermalReceiptShellProps = {
  children: ReactNode;
  className?: string;
  id?: string;
  paperProfile?: PaperProfile;
};

export function ThermalReceiptShell({
  children,
  className,
  id,
  paperProfile = DEFAULT_PAPER_PROFILE,
}: ThermalReceiptShellProps) {
  return (
    <article
      id={id}
      className={cn(
        "thermal-receipt mx-auto w-full bg-white text-black",
        "font-sans leading-snug",
        className,
      )}
      style={{
        maxWidth: paperProfile.cssWidth,
        padding: `${paperProfile.paddingMm}mm`,
      }}
    >
      {children}
    </article>
  );
}

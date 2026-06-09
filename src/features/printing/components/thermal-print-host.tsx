"use client";

import type { ReactNode } from "react";
import { createPortal } from "react-dom";

type ThermalPrintHostProps = {
  children: ReactNode;
  open: boolean;
};

export function ThermalPrintHost({ children, open }: ThermalPrintHostProps) {
  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div data-thermal-print-host className="hidden print:flex">
      {children}
    </div>,
    document.body,
  );
}

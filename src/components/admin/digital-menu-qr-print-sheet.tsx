"use client";

import { QRCodeCanvas } from "qrcode.react";
import "./digital-menu-qr-print.css";

type DigitalMenuQrPrintSheetProps = {
  cafeName: string;
  logo: string | null;
  menuUrl: string;
};

export function DigitalMenuQrPrintSheet({
  cafeName,
  logo,
  menuUrl,
}: DigitalMenuQrPrintSheetProps) {
  const initial = cafeName.trim().charAt(0).toUpperCase() || "C";

  return (
    <div className="qr-print-sheet" aria-hidden>
      <div className="flex max-w-sm flex-col items-center text-center text-black">
        {logo ? (
          <img
            src={logo}
            alt=""
            className="mb-3 h-16 max-w-[8rem] object-contain"
          />
        ) : (
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl border border-neutral-300 bg-neutral-100 text-2xl font-bold text-neutral-700">
            {initial}
          </div>
        )}
        <h1 className="text-xl font-bold text-black">{cafeName}</h1>
        <div className="my-6 rounded-xl border border-neutral-200 bg-white p-4">
          <QRCodeCanvas
            value={menuUrl}
            size={220}
            level="H"
            includeMargin
            bgColor="#ffffff"
            fgColor="#000000"
          />
        </div>
        <p className="text-lg font-semibold text-black">Scan to view our menu</p>
        <p className="mt-2 text-sm text-neutral-600">Scan with your phone camera</p>
        <p className="mt-4 max-w-full break-all text-[8pt] text-neutral-500">{menuUrl}</p>
      </div>
    </div>
  );
}

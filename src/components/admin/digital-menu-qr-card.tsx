"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ExternalLink, Printer, QrCode } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { appToast } from "@/src/lib/toast";
import { getPublicMenuUrl } from "@/src/services/public-menu-api";
import { useAppSelector } from "@/src/store/hooks";
import {
  activatePrintMode,
  deactivatePrintMode,
} from "@/src/features/printing/lib/activate-print-mode";
import { DigitalMenuQrPrintSheet } from "./digital-menu-qr-print-sheet";

export function DigitalMenuQrCard() {
  const user = useAppSelector((s) => s.auth.user);
  const slug = user?.cafe?.slug;
  const cafeName = user?.cafe?.cafeName ?? "Cafe";
  const logo = user?.cafe?.logo ?? null;
  const qrRef = useRef<HTMLCanvasElement>(null);
  const [menuUrl, setMenuUrl] = useState("");
  const [printOpen, setPrintOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (slug) {
      setMenuUrl(getPublicMenuUrl(slug));
    }
  }, [slug]);

  useEffect(() => {
    if (!printOpen) return;
    const onAfterPrint = () => {
      deactivatePrintMode("qr");
      setPrintOpen(false);
    };
    window.addEventListener("afterprint", onAfterPrint);
    return () => {
      window.removeEventListener("afterprint", onAfterPrint);
      deactivatePrintMode("qr");
    };
  }, [printOpen]);

  const copyLink = useCallback(async () => {
    if (!menuUrl) return;
    try {
      await navigator.clipboard.writeText(menuUrl);
      appToast.success("Menu link copied");
    } catch {
      appToast.error("Could not copy link");
    }
  }, [menuUrl]);

  const downloadPng = useCallback(() => {
    const canvas = qrRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${slug ?? "menu"}-qr.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    appToast.success("QR code downloaded");
  }, [slug]);

  const printQr = useCallback(() => {
    setPrintOpen(true);
    requestAnimationFrame(() => {
      activatePrintMode("qr");
      requestAnimationFrame(() => {
        window.print();
      });
    });
  }, []);

  if (!slug) return null;

  return (
    <>
      <Card className="overflow-hidden border-t-4 border-t-[var(--color-primary)] p-0">
        <div className="space-y-4 p-4 md:p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
              <QrCode className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            </span>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-[var(--color-foreground)]">
                Digital Menu
              </h2>
              <p className="mt-0.5 text-sm text-[var(--color-muted)]">
                Print and place on tables — customers scan to browse
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-[auto_1fr] md:items-start">
            <div className="flex justify-center rounded-xl border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-sm)] md:justify-start">
              <QRCodeCanvas
                ref={qrRef}
                value={menuUrl}
                size={140}
                level="H"
                includeMargin
                bgColor="#ffffff"
                fgColor="#000000"
              />
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--color-muted)]">
                  Menu URL
                </label>
                <Input
                  readOnly
                  value={menuUrl}
                  className="font-mono text-xs"
                  onFocus={(e) => e.target.select()}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="brand" size="sm" onClick={printQr}>
                  <Printer className="h-4 w-4" aria-hidden />
                  Print QR
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={() => void copyLink()}>
                  Copy link
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={downloadPng}>
                  Download PNG
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => window.open(menuUrl, "_blank", "noopener,noreferrer")}
                >
                  <ExternalLink className="h-4 w-4" aria-hidden />
                  Preview menu
                </Button>
              </div>
              <p className="text-xs text-[var(--color-muted)]">
                Print once per table — the QR link never changes; menu updates appear automatically.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {mounted && printOpen
        ? createPortal(
            <DigitalMenuQrPrintSheet
              cafeName={cafeName}
              logo={logo}
              menuUrl={menuUrl}
            />,
            document.body,
          )
        : null}
    </>
  );
}

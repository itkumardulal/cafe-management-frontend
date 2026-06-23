"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal, flushSync } from "react-dom";
import { PrintableMenuSheet } from "../components/printable-menu-sheet";
import { exportMenuToPdf } from "../lib/menu-pdf-export";
import { inlineCrossOriginImages } from "../lib/inline-cross-origin-images";
import type { PrintableMenuData } from "../types";
import {
  activatePrintMode,
  deactivatePrintMode,
} from "@/src/features/printing/lib/activate-print-mode";

function waitForImages(root: HTMLElement, timeoutMs = 3000) {
  const images = Array.from(root.querySelectorAll("img"));
  if (images.length === 0) return Promise.resolve();

  const waitForImage = (img: HTMLImageElement) =>
    new Promise<void>((resolve) => {
      if (img.complete && img.naturalHeight > 0) {
        resolve();
        return;
      }
      const done = () => {
        img.removeEventListener("load", done);
        img.removeEventListener("error", done);
        resolve();
      };
      img.addEventListener("load", done);
      img.addEventListener("error", done);
    });

  return Promise.race([
    Promise.all(images.map(waitForImage)).then(() => undefined),
    new Promise<void>((resolve) => window.setTimeout(resolve, timeoutMs)),
  ]);
}

async function waitForSheetMount(getSheet: () => HTMLDivElement | null) {
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
  const sheet = getSheet();
  if (!sheet) {
    throw new Error("Print sheet not ready");
  }
  return sheet;
}

export function usePrintableMenu() {
  const [data, setData] = useState<PrintableMenuData | null>(null);
  const [exporting, setExporting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const mountSheet = useCallback((menuData: PrintableMenuData) => {
    flushSync(() => {
      setData(menuData);
    });
  }, []);

  const downloadPdf = useCallback(async (menuData: PrintableMenuData) => {
    setExporting(true);
    mountSheet(menuData);
    try {
      const root = await waitForSheetMount(() => sheetRef.current);
      await waitForImages(root);
      await inlineCrossOriginImages(root);
      await waitForImages(root);
      await exportMenuToPdf(menuData, root);
    } finally {
      setExporting(false);
      setData(null);
    }
  }, [mountSheet]);

  const printMenu = useCallback(async (menuData: PrintableMenuData) => {
    mountSheet(menuData);
    const root = await waitForSheetMount(() => sheetRef.current);
    await waitForImages(root);
    activatePrintMode("menu");
    window.print();
    const onAfterPrint = () => {
      deactivatePrintMode("menu");
      setData(null);
      window.removeEventListener("afterprint", onAfterPrint);
    };
    window.addEventListener("afterprint", onAfterPrint);
  }, [mountSheet]);

  const portal =
    mounted && data
      ? createPortal(
          <div className="menu-print-mount">
            <PrintableMenuSheet ref={sheetRef} data={data} />
          </div>,
          document.body,
        )
      : null;

  return { downloadPdf, printMenu, exporting, portal };
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  activatePrintMode,
  deactivatePrintMode,
} from "@/src/features/printing/lib/activate-print-mode";

const PRINT_FALLBACK_MS = 3000;

type UseThermalPrintOptions = {
  onError?: (error: unknown) => void;
  onAfterPrint?: () => void;
};

function waitForNextFrame() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

export function useThermalPrint<T>(options: UseThermalPrintOptions = {}) {
  const { onError, onAfterPrint } = options;
  const [printDocument, setPrintDocument] = useState<T | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const pendingPrintRef = useRef(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  const clearPrint = useCallback(() => {
    pendingPrintRef.current = false;
    setPrintDocument(null);
    setIsPrinting(false);
    deactivatePrintMode("thermal");
    cleanupRef.current?.();
    cleanupRef.current = null;
  }, []);

  const runPrint = useCallback(async () => {
    activatePrintMode("thermal");
    await waitForNextFrame();
    window.print();
  }, []);

  useEffect(() => {
    if (!printDocument || !pendingPrintRef.current) return;

    pendingPrintRef.current = false;
    let settled = false;

    const finish = () => {
      if (settled) return;
      settled = true;
      deactivatePrintMode("thermal");
      setPrintDocument(null);
      setIsPrinting(false);
      onAfterPrint?.();
      cleanupRef.current?.();
      cleanupRef.current = null;
    };

    const onAfterPrintEvent = () => finish();
    window.addEventListener("afterprint", onAfterPrintEvent);
    const fallbackTimer = window.setTimeout(finish, PRINT_FALLBACK_MS);

    cleanupRef.current = () => {
      window.removeEventListener("afterprint", onAfterPrintEvent);
      window.clearTimeout(fallbackTimer);
    };

    void runPrint();
  }, [printDocument, onAfterPrint, runPrint]);

  const requestPrint = useCallback(
    async (fetchFn: () => Promise<T>) => {
      if (isPrinting) return;
      setIsPrinting(true);
      try {
        const data = await fetchFn();
        pendingPrintRef.current = true;
        setPrintDocument(data);
      } catch (error) {
        setIsPrinting(false);
        onError?.(error);
      }
    },
    [isPrinting, onError],
  );

  const printLoaded = useCallback(
    (data: T) => {
      if (isPrinting) return;
      setIsPrinting(true);
      pendingPrintRef.current = true;
      setPrintDocument(data);
    },
    [isPrinting],
  );

  return {
    printDocument,
    isPrinting,
    requestPrint,
    printLoaded,
    clearPrint,
  };
}

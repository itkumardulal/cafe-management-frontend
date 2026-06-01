"use client";

import { Toaster } from "sonner";
import { useIsMobileViewport } from "@/src/hooks/use-breakpoint";
import { cn } from "@/src/lib/cn";

export function ResponsiveToaster() {
  const isMobile = useIsMobileViewport();

  return (
    <Toaster
      richColors
      closeButton
      position={isMobile ? "bottom-center" : "top-center"}
      offset={
        isMobile
          ? { bottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }
          : 8
      }
      toastOptions={{
        className: cn("max-w-[calc(100vw-2rem)]"),
      }}
    />
  );
}

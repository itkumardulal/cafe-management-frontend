"use client";

import { useIsMobileViewport } from "@/src/hooks/use-breakpoint";

export function useChartLayout() {
  const isMobile = useIsMobileViewport();

  return {
    isMobile,
    yAxisWidth: isMobile ? 48 : 72,
    yAxisWidthCompact: isMobile ? 32 : 40,
    categoryAxisWidth: isMobile ? 72 : 100,
    pieInnerRadius: isMobile ? 40 : 50,
    pieOuterRadius: isMobile ? 64 : 80,
    chartMargin: isMobile
      ? { top: 8, right: 4, left: -8, bottom: 0 }
      : { top: 8, right: 8, left: 0, bottom: 0 },
    legendStyle: isMobile ? { fontSize: 10, paddingTop: 8 } : undefined,
  };
}

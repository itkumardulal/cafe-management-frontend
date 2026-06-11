"use client";

import { useEffect, useRef, useState, type ReactElement } from "react";
import { ResponsiveContainer } from "recharts";
import { cn } from "@/src/lib/cn";

type AnalyticsChartViewportProps = {
  children: ReactElement;
  className?: string;
};

export function AnalyticsChartViewport({ children, className }: AnalyticsChartViewportProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }

    const updateSize = () => {
      const { width, height } = node.getBoundingClientRect();
      if (width > 0 && height > 0) {
        setSize({
          width: Math.floor(width),
          height: Math.floor(height),
        });
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn("h-64 w-full min-h-[16rem] min-w-0 sm:h-72", className)}
    >
      {size ? (
        <ResponsiveContainer width={size.width} height={size.height} minWidth={0}>
          {children}
        </ResponsiveContainer>
      ) : null}
    </div>
  );
}

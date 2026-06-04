"use client";

import { useEffect, useState } from "react";
import { appToast } from "@/src/lib/toast";

export function useReportLoader<T>(
  loader: () => Promise<T>,
  deps: readonly unknown[],
  errorMessage: string,
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void loader()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch(() => appToast.error(errorMessage))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps array is caller-controlled
  }, deps);

  return { data, loading };
}

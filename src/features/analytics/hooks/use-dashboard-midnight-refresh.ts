"use client";

import { useEffect, useRef } from "react";
import { millisecondsUntilNextZonedMidnight } from "@/src/lib/app-timezone";

/**
 * Calls `onMidnight` at 12:00 AM in the app timezone (Asia/Kathmandu) while mounted.
 */
export function useDashboardMidnightRefresh(onMidnight: () => void) {
  const callbackRef = useRef(onMidnight);
  callbackRef.current = onMidnight;

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const schedule = () => {
      const delay = millisecondsUntilNextZonedMidnight() + 50;
      timeoutId = setTimeout(() => {
        callbackRef.current();
        schedule();
      }, delay);
    };

    schedule();

    return () => {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
    };
  }, []);
}

"use client";

import { useEffect, useState } from "react";
import { MEDIA_DESKTOP_UP, MEDIA_MOBILE, MEDIA_TABLET_UP } from "@/src/lib/design-contract";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setMatches(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [query]);

  return matches;
}

export function useIsMobileViewport(): boolean {
  return useMediaQuery(MEDIA_MOBILE);
}

export function useIsTabletViewport(): boolean {
  return useMediaQuery(MEDIA_TABLET_UP);
}

export function useIsDesktopViewport(): boolean {
  return useMediaQuery(MEDIA_DESKTOP_UP);
}

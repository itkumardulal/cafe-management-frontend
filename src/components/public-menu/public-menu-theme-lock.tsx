"use client";

import { useEffect } from "react";

/**
 * Keeps the customer menu on a fixed light palette even when the admin app
 * has dark mode stored in localStorage (html.dark on documentElement).
 */
export function PublicMenuThemeLock() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark");
    root.style.colorScheme = "light";

    const observer = new MutationObserver(() => {
      if (root.classList.contains("dark")) {
        root.classList.remove("dark");
      }
    });

    observer.observe(root, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      observer.disconnect();
      root.style.colorScheme = "";
      const stored = localStorage.getItem("cms-theme");
      root.classList.toggle("dark", stored === "dark");
    };
  }, []);

  return null;
}

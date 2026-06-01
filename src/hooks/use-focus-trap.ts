"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useFocusTrap(active: boolean, onEscape?: () => void) {
  const containerRef = useRef<HTMLElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const wasActiveRef = useRef(false);
  const onEscapeRef = useRef(onEscape);
  onEscapeRef.current = onEscape;

  useEffect(() => {
    if (!active) {
      if (wasActiveRef.current) {
        wasActiveRef.current = false;
        previousFocusRef.current?.focus?.();
      }
      return;
    }

    const justOpened = !wasActiveRef.current;
    wasActiveRef.current = true;

    if (justOpened) {
      previousFocusRef.current = document.activeElement as HTMLElement | null;

      const container = containerRef.current;
      if (container) {
        const preferred = container.querySelector<HTMLElement>(
          "input:not([disabled]), textarea:not([disabled]), select:not([disabled])",
        );
        const focusable = container.querySelectorAll<HTMLElement>(FOCUSABLE);
        (preferred ?? focusable[0])?.focus();
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onEscapeRef.current?.();
        return;
      }
      if (event.key !== "Tab" || !containerRef.current) {
        return;
      }

      const focusable = Array.from(
        containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);

      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [active, onEscape]);

  return containerRef;
}

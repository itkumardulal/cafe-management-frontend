"use client";

import { AnimatePresence, motion } from "framer-motion";
import { type ReactNode, useCallback } from "react";
import { useBodyScrollLock } from "@/src/hooks/use-body-scroll-lock";
import { useFocusTrap } from "@/src/hooks/use-focus-trap";
import { cn } from "@/src/lib/cn";

export type DrawerSide = "left" | "bottom";

export type DrawerProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  side?: DrawerSide;
  children: ReactNode;
  className?: string;
};

export function Drawer({
  open,
  onClose,
  title = "Navigation drawer",
  side = "left",
  children,
  className,
}: DrawerProps) {
  const handleEscape = useCallback(() => onClose(), [onClose]);
  const containerRef = useFocusTrap(open, handleEscape);
  useBodyScrollLock(open);

  const isBottom = side === "bottom";

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            aria-label="Close drawer"
            className="fixed inset-0 z-40 bg-black/35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            ref={containerRef as React.RefObject<HTMLElement>}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={isBottom ? { y: "100%" } : { x: "-100%" }}
            animate={isBottom ? { y: 0 } : { x: 0 }}
            exit={isBottom ? { y: "100%" } : { x: "-100%" }}
            transition={{ duration: 0.24 }}
            className={cn(
              "fixed z-50 flex flex-col overflow-hidden bg-[var(--color-surface)] shadow-[var(--shadow-lg)]",
              isBottom
                ? "safe-bottom bottom-0 left-0 right-0 max-h-[92dvh] rounded-t-2xl border-t border-[var(--color-border)]"
                : "left-0 top-0 h-full w-[86vw] max-w-80 border-r border-[var(--color-border)] p-4",
              className,
            )}
          >
            {children}
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

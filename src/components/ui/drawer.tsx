"use client";

import { AnimatePresence, motion } from "framer-motion";
import { type ReactNode } from "react";
import { cn } from "@/src/lib/cn";

export function Drawer({
  open,
  onClose,
  title = "Navigation drawer",
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            aria-label="Close navigation drawer"
            className="fixed inset-0 z-40 bg-black/35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.24 }}
            className={cn(
              "fixed left-0 top-0 z-50 flex h-full w-[86vw] max-w-80 flex-col overflow-hidden border-r border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-lg)]",
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

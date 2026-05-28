"use client";

import { AnimatePresence, motion } from "framer-motion";
import { type ReactNode } from "react";

export function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            className="fixed inset-0 z-40 bg-black/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            onClick={onClose}
            aria-label="Close modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ y: 18, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 18, opacity: 0 }}
            className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-lg)]"
          >
            {children}
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

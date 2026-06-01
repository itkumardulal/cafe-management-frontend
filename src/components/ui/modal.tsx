"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { type ReactNode, useCallback, useId } from "react";
import { useBodyScrollLock } from "@/src/hooks/use-body-scroll-lock";
import { useFocusTrap } from "@/src/hooks/use-focus-trap";
import { useIsMobileViewport } from "@/src/hooks/use-breakpoint";
import { cn } from "@/src/lib/cn";

const sizeClasses = {
  md: "md:max-w-lg",
  lg: "md:max-w-2xl",
  xl: "md:max-w-3xl",
} as const;

export type ModalSize = keyof typeof sizeClasses;
export type ModalMobileVariant = "sheet" | "fullscreen";

export type ModalProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
  mobileVariant?: ModalMobileVariant;
};

export function Modal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  size = "md",
  mobileVariant = "sheet",
}: ModalProps) {
  const titleId = useId();
  const isMobile = useIsMobileViewport();
  const handleEscape = useCallback(() => onClose(), [onClose]);
  const containerRef = useFocusTrap(open, handleEscape);
  useBodyScrollLock(open);

  const isFullscreen = mobileVariant === "fullscreen";
  const useSheet = isMobile && !isFullscreen;

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            onClick={onClose}
            aria-label="Close modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            ref={containerRef as React.RefObject<HTMLDivElement>}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={
              isFullscreen
                ? { opacity: 0 }
                : useSheet
                  ? { y: "100%", opacity: 1 }
                  : { y: 20, opacity: 0, scale: 0.98 }
            }
            animate={
              isFullscreen
                ? { opacity: 1 }
                : useSheet
                  ? { y: 0, opacity: 1 }
                  : { y: 0, opacity: 1, scale: 1 }
            }
            exit={
              isFullscreen
                ? { opacity: 0 }
                : useSheet
                  ? { y: "100%", opacity: 1 }
                  : { y: 20, opacity: 0, scale: 0.98 }
            }
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className={cn(
              "fixed z-50 flex flex-col overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-lg)]",
              isFullscreen
                ? "inset-0 rounded-none"
                : "safe-bottom bottom-0 left-0 right-0 max-h-[min(92dvh,880px)] rounded-t-2xl md:bottom-auto md:left-1/2 md:top-1/2 md:max-h-[min(92vh,880px)] md:w-[min(92vw,100%)] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl",
              sizeClasses[size],
            )}
          >
            <div className="relative shrink-0 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)] px-5 py-4 sm:px-6">
              <div className="pr-10">
                <h2
                  id={titleId}
                  className="text-base font-semibold text-[var(--color-foreground)] sm:text-lg"
                >
                  {title}
                </h2>
                {description ? (
                  <p className="mt-1 text-sm text-[var(--color-muted)]">{description}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="icon-button-square absolute right-4 top-4 border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] transition-colors hover:bg-[var(--color-cream-100)] hover:text-[var(--color-foreground)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
                aria-label="Close"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
            {footer ? (
              <div className="shrink-0 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3 sm:px-6">
                {footer}
              </div>
            ) : null}
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

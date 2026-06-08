"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import {
  Combine,
  Loader2,
  Minus,
  Plus,
  Receipt,
  Split,
  Trash2,
  X,
} from "lucide-react";
import { tableOrdersScrollArea } from "@/src/components/table-orders/table-orders-layout";
import { StatusChip } from "@/src/components/table-orders/table-status";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/cn";
import { formatMoney } from "@/src/lib/format-display";

export type OrderSlipLine = {
  key: string;
  name: string;
  unitPrice: number;
  qty: number;
  maxQty: number;
};

type TableOrderSlipProps = {
  tableNames: string[];
  status: "OPEN" | "IN_BILLING" | "CLOSED" | "CANCELLED";
  saving: boolean;
  lines: OrderSlipLine[];
  lastAddedKey: string | null;
  subtotal: number;
  editable: boolean;
  generating: boolean;
  mergeDisabled?: boolean;
  unmergeDisabled?: boolean;
  onMerge?: () => void;
  onUnmerge?: () => void;
  onClose?: () => void;
  onUpdateQty: (key: string, qty: number) => void;
  onRemove: (key: string) => void;
  onGenerateBill: () => void;
  onCancelBilling?: () => void;
  cancellingBilling?: boolean;
  onGoToPos?: () => void;
};

export function TableOrderSlip({
  tableNames,
  status,
  saving,
  lines,
  lastAddedKey,
  subtotal,
  editable,
  generating,
  mergeDisabled,
  unmergeDisabled,
  onMerge,
  onUnmerge,
  onClose,
  onUpdateQty,
  onRemove,
  onGenerateBill,
  onCancelBilling,
  cancellingBilling,
  onGoToPos,
}: TableOrderSlipProps) {
  const listRef = useRef<HTMLUListElement>(null);
  const isOpen = status === "OPEN";
  const isBilling = status === "IN_BILLING";

  useEffect(() => {
    if (!lastAddedKey || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-line-key="${lastAddedKey}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [lastAddedKey, lines.length]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-surface)] text-[var(--color-primary)] shadow-[var(--shadow-sm)]">
                <Receipt className="h-4 w-4" strokeWidth={1.5} aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-muted)]">
                  Order ticket
                </p>
                <p className="truncate font-mono text-sm font-semibold text-[var(--color-foreground)]">
                  {tableNames.join(" + ")}
                </p>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {status === "OPEN" ? (
                <StatusChip
                  status={lines.length === 0 ? "VACANT" : "IN_PROGRESS"}
                  pulse={lines.length > 0}
                />
              ) : status === "IN_BILLING" ? (
                <StatusChip status="IN_BILLING" />
              ) : null}
              {saving ? (
                <span className="text-[11px] text-[var(--color-muted)]">Saving…</span>
              ) : null}
            </div>
          </div>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--color-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-foreground)] lg:hidden"
              aria-label="Close order"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        {isOpen && (onMerge || onUnmerge) ? (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {onMerge ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="h-7 text-xs"
                onClick={onMerge}
                disabled={mergeDisabled}
              >
                <Combine className="mr-1 h-3 w-3" />
                Merge
              </Button>
            ) : null}
            {onUnmerge ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="h-7 text-xs"
                onClick={onUnmerge}
                disabled={unmergeDisabled}
              >
                <Split className="mr-1 h-3 w-3" />
                Unmerge
              </Button>
            ) : null}
            {onClose ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="hidden h-7 text-xs lg:inline-flex"
                onClick={onClose}
              >
                Close
              </Button>
            ) : null}
          </div>
        ) : isBilling && (onCancelBilling || onGoToPos) ? (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {onCancelBilling ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="h-7 text-xs"
                onClick={onCancelBilling}
                disabled={cancellingBilling}
              >
                {cancellingBilling ? "Cancelling…" : "Resume editing"}
              </Button>
            ) : null}
            {onGoToPos ? (
              <Button type="button" size="sm" className="h-7 text-xs" onClick={onGoToPos}>
                Continue at POS
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      {isBilling ? (
        <p className="shrink-0 border-b border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-warning)_8%,var(--color-surface))] px-4 py-2 text-[11px] leading-snug text-[var(--color-muted)]">
          Order is locked for billing. Use <span className="font-medium text-[var(--color-foreground)]">Resume editing</span> to remove items, or continue at POS to take payment.
        </p>
      ) : null}

      <div className={cn(tableOrdersScrollArea, "px-3 py-3")}>
        {lines.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-10 text-center">
            <Receipt className="h-9 w-9 text-[var(--color-muted)] opacity-50" strokeWidth={1.25} aria-hidden />
            <p className="mt-3 text-sm font-medium text-[var(--color-foreground)]">No items yet</p>
            <p className="mt-1 max-w-[14rem] text-xs text-[var(--color-muted)]">
              {isBilling
                ? "Resume editing to clear this order and free the table."
                : "Tap dishes in the menu to add them here."}
            </p>
          </div>
        ) : (
          <ul ref={listRef} className="space-y-2">
            {lines.map((l) => {
              const lineTotal = Math.round(l.qty * l.unitPrice * 100) / 100;
              const isLastAdded = lastAddedKey === l.key;
              return (
                <li
                  key={l.key}
                  data-line-key={l.key}
                  className={cn(
                    "rounded-xl border bg-[var(--color-surface)] p-3",
                    isLastAdded
                      ? "border-[var(--color-primary)]/40 shadow-[var(--shadow-sm)]"
                      : "border-[var(--color-border)]",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      {isLastAdded ? (
                        <span className="mb-1 inline-block text-[10px] font-semibold uppercase tracking-wide text-[var(--color-primary)]">
                          Latest
                        </span>
                      ) : null}
                      <p className="text-sm font-semibold leading-snug text-[var(--color-foreground)]">
                        {l.name}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                        {formatMoney(l.unitPrice)} × {l.qty % 1 === 0 ? l.qty : l.qty.toFixed(2)}
                      </p>
                    </div>
                    <p className="shrink-0 font-mono text-sm font-semibold tabular-nums text-[var(--color-foreground)]">
                      {formatMoney(lineTotal)}
                    </p>
                  </div>
                  {editable ? (
                    <div className="mt-2.5 flex items-center justify-between gap-2">
                      <div className="inline-flex items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-0.5">
                        <QtyButton
                          label={l.qty <= 1 ? "Remove item" : "Decrease"}
                          onClick={() =>
                            l.qty <= 1 ? onRemove(l.key) : onUpdateQty(l.key, l.qty - 1)
                          }
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </QtyButton>
                        <span className="min-w-[2.25rem] text-center font-mono text-sm font-semibold tabular-nums">
                          {l.qty % 1 === 0 ? l.qty : l.qty.toFixed(2)}
                        </span>
                        <QtyButton
                          label="Increase"
                          onClick={() => onUpdateQty(l.key, Math.min(l.maxQty, l.qty + 1))}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </QtyButton>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemove(l.key)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-danger)] hover:bg-red-50 dark:hover:bg-red-950/40"
                        aria-label={`Remove ${l.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="shrink-0 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xs font-medium text-[var(--color-muted)]">Subtotal</span>
          <span className="font-mono text-base font-bold tabular-nums tracking-tight text-[var(--color-foreground)]">
            {formatMoney(subtotal)}
          </span>
        </div>
        {status === "OPEN" ? (
          <Button
            type="button"
            size="sm"
            className="mt-2 h-9 w-full text-sm"
            disabled={generating || lines.length === 0}
            onClick={onGenerateBill}
          >
            {generating ? (
              <span className="inline-flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Opening POS…
              </span>
            ) : (
              "Generate bill"
            )}
          </Button>
        ) : isBilling ? (
          <div className="mt-2 space-y-2">
            {onGoToPos ? (
              <Button type="button" size="sm" className="h-9 w-full text-sm" onClick={onGoToPos}>
                Continue at POS
              </Button>
            ) : null}
            {onCancelBilling ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="h-9 w-full text-sm"
                onClick={onCancelBilling}
                disabled={cancellingBilling}
              >
                {cancellingBilling ? "Cancelling…" : "Resume editing"}
              </Button>
            ) : null}
          </div>
        ) : null}
        <p className="mt-1.5 text-center text-[9px] leading-snug text-[var(--color-muted)]">
          {isBilling
            ? "Resume editing to change items, or complete payment at POS."
            : "Payment is completed in POS after generating the bill."}
        </p>
      </div>
    </div>
  );
}

function QtyButton({
  children,
  label,
  onClick,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--color-foreground)] hover:bg-[var(--color-cream-100)]"
    >
      {children}
    </button>
  );
}

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
  notes?: string | null;
};

type TableOrderSlipProps = {
  tableNames: string[];
  status: "OPEN" | "AWAITING_SETTLEMENT" | "IN_BILLING" | "CLOSED" | "CANCELLED";
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
  onMoveToBill?: () => void;
  movingToBill?: boolean;
  onPrintInterimBill?: () => void;
  printingInterimBill?: boolean;
  onCancelBilling?: () => void;
  cancellingBilling?: boolean;
  onGoToPos?: () => void;
  menuSearchActive?: boolean;
  onClearMenuSearch?: () => void;
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
  onMoveToBill,
  movingToBill,
  onPrintInterimBill,
  printingInterimBill,
  onCancelBilling,
  cancellingBilling,
  onGoToPos,
  menuSearchActive,
  onClearMenuSearch,
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
      <div className="shrink-0 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--color-surface-muted)] text-[var(--color-primary)]">
            <Receipt className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
              Order ticket
            </p>
            <p className="truncate font-mono text-sm font-semibold leading-tight text-[var(--color-foreground)]">
              {tableNames.join(" + ")}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {status === "OPEN" ? (
              <StatusChip
                status={lines.length === 0 ? "VACANT" : "IN_PROGRESS"}
                pulse={lines.length > 0}
              />
            ) : status === "IN_BILLING" ? (
              <StatusChip status="IN_BILLING" />
            ) : null}

            {isOpen && onMerge ? (
              <SlipIconAction
                label="Merge tables"
                onClick={onMerge}
                disabled={mergeDisabled}
              >
                <Combine className="h-3.5 w-3.5" />
              </SlipIconAction>
            ) : null}
            {isOpen && onUnmerge ? (
              <SlipIconAction
                label="Unmerge table"
                onClick={onUnmerge}
                disabled={unmergeDisabled}
              >
                <Split className="h-3.5 w-3.5" />
              </SlipIconAction>
            ) : null}
            {onClose ? (
              <SlipIconAction label="Close order" onClick={onClose}>
                <X className="h-3.5 w-3.5" />
              </SlipIconAction>
            ) : null}
          </div>
        </div>

        {saving || (menuSearchActive && onClearMenuSearch) || (isBilling && (onCancelBilling || onGoToPos)) ? (
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {saving ? (
              <span className="text-[10px] text-[var(--color-muted)]">Saving…</span>
            ) : null}
            {menuSearchActive && onClearMenuSearch ? (
              <button
                type="button"
                onClick={onClearMenuSearch}
                className="inline-flex items-center gap-1 rounded border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-muted)] transition-colors hover:border-[var(--color-input)] hover:text-[var(--color-foreground)]"
              >
                <X className="h-2.5 w-2.5" aria-hidden />
                Clear search
              </button>
            ) : null}
            {isBilling && onCancelBilling ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="h-6 px-2 text-[10px]"
                onClick={onCancelBilling}
                disabled={cancellingBilling}
              >
                {cancellingBilling ? "Cancelling…" : "Resume editing"}
              </Button>
            ) : null}
            {isBilling && onGoToPos ? (
              <Button type="button" size="sm" className="h-6 px-2 text-[10px]" onClick={onGoToPos}>
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

      <div className={cn(tableOrdersScrollArea, "min-h-[8rem] px-3 py-2")}>
        {lines.length === 0 ? (
          <div className="flex h-full min-h-[7rem] flex-col items-center justify-center rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-5 text-center">
            <Receipt className="h-7 w-7 text-[var(--color-muted)] opacity-50" strokeWidth={1.25} aria-hidden />
            <p className="mt-2 text-sm font-medium text-[var(--color-foreground)]">No items yet</p>
            <p className="mt-0.5 max-w-[14rem] text-xs text-[var(--color-muted)]">
              {isBilling
                ? "Resume editing to clear this order and free the table."
                : "Search dishes above or browse categories, then tap Add."}
            </p>
          </div>
        ) : (
          <ul ref={listRef} className="space-y-2">
            {lines.map((l) => {
              const lineTotal = Math.round(l.qty * l.unitPrice * 100) / 100;
              const isLastAdded = lastAddedKey === l.key;
              const over = l.maxQty < 999_999 && l.qty > l.maxQty;
              return (
                <li
                  key={l.key}
                  data-line-key={l.key}
                  className={cn(
                    "rounded-lg border px-2.5 py-2 transition-colors",
                    over
                      ? "border-red-300/60 bg-red-500/5"
                      : isLastAdded
                        ? "border-[var(--color-primary)]/40 bg-[color-mix(in_srgb,var(--color-primary)_4%,var(--color-surface))]"
                        : "border-[var(--color-border)] bg-[var(--color-surface)]",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-1.5">
                        {isLastAdded ? (
                          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-primary)]">
                            New
                          </span>
                        ) : null}
                        <p className="truncate text-sm font-medium text-[var(--color-foreground)]">
                          {l.name}
                        </p>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        {editable ? (
                          <div className="inline-flex shrink-0 items-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-0.5">
                            <QtyButton
                              label={l.qty <= 1 ? "Remove item" : "Decrease quantity"}
                              onClick={() =>
                                l.qty <= 1 ? onRemove(l.key) : onUpdateQty(l.key, l.qty - 1)
                              }
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </QtyButton>
                            <span className="min-w-[1.5rem] px-0.5 text-center font-mono text-xs font-semibold tabular-nums text-[var(--color-foreground)]">
                              {l.qty % 1 === 0 ? l.qty : l.qty.toFixed(2)}
                            </span>
                            <QtyButton
                              label="Increase quantity"
                              onClick={() => onUpdateQty(l.key, Math.min(l.maxQty, l.qty + 1))}
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </QtyButton>
                          </div>
                        ) : (
                          <span className="font-mono text-xs font-semibold tabular-nums text-[var(--color-foreground)]">
                            {l.qty % 1 === 0 ? l.qty : l.qty.toFixed(2)}
                          </span>
                        )}
                        <span className="text-[10px] text-[var(--color-muted)]" aria-hidden>
                          ×
                        </span>
                        <span className="font-mono text-xs tabular-nums text-[var(--color-muted)]">
                          {formatMoney(l.unitPrice)}
                        </span>
                        {over ? (
                          <span className="text-[10px] text-red-600">Max {l.maxQty}</span>
                        ) : null}
                      </div>
                    </div>
                    <span className="shrink-0 font-mono text-sm font-semibold tabular-nums text-[var(--color-foreground)]">
                      {formatMoney(lineTotal)}
                    </span>
                    {editable ? (
                      <button
                        type="button"
                        onClick={() => onRemove(l.key)}
                        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[var(--color-danger)] hover:bg-red-50 dark:hover:bg-red-950/40"
                        aria-label={`Remove ${l.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                  </div>
                  {l.notes ? (
                    <p className="mt-1 text-[11px] italic text-[var(--color-subtle)]">{l.notes}</p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="shrink-0 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1">
        <div className="flex items-center justify-between gap-2 rounded-md bg-[var(--color-surface-muted)] px-2.5 py-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
            Subtotal
          </span>
          <span className="font-mono text-base font-bold tabular-nums tracking-tight text-[var(--color-foreground)]">
            {formatMoney(subtotal)}
          </span>
        </div>
        {status === "OPEN" ? (
          <div className="mt-1 space-y-1">
            <div className="flex gap-1">
              <Button
                type="button"
                size="sm"
                className="h-7 min-w-0 flex-1 px-2 text-[10px]"
                disabled={generating || movingToBill || lines.length === 0}
                onClick={onGenerateBill}
                title="Generate bill"
              >
                {generating ? (
                  <span className="inline-flex items-center gap-1">
                    <Loader2 className="h-3 w-3 shrink-0 animate-spin" />
                    <span className="truncate">POS…</span>
                  </span>
                ) : (
                  <span className="truncate">Generate bill</span>
                )}
              </Button>
              {onMoveToBill ? (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="h-7 min-w-0 flex-1 px-2 text-[10px]"
                  disabled={generating || movingToBill || lines.length === 0}
                  onClick={onMoveToBill}
                  title="Move to bill (free table)"
                >
                  {movingToBill ? (
                    <span className="inline-flex items-center gap-1">
                      <Loader2 className="h-3 w-3 shrink-0 animate-spin" />
                      <span className="truncate">Moving…</span>
                    </span>
                  ) : (
                    <span className="truncate">Free table</span>
                  )}
                </Button>
              ) : null}
            </div>
            {onPrintInterimBill ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 w-full border border-[var(--color-border)] px-2 text-[10px]"
                disabled={
                  saving ||
                  generating ||
                  movingToBill ||
                  printingInterimBill ||
                  lines.length === 0
                }
                onClick={onPrintInterimBill}
                title="Print running total for the guest — does not take payment or close the table"
              >
                {printingInterimBill ? (
                  <span className="inline-flex items-center gap-1">
                    <Loader2 className="h-3 w-3 shrink-0 animate-spin" />
                    <span className="truncate">Printing…</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1">
                    <Receipt className="h-3 w-3 shrink-0" aria-hidden />
                    <span className="truncate">Interim bill</span>
                  </span>
                )}
              </Button>
            ) : null}
          </div>
        ) : isBilling ? (
          <div className="mt-1 flex gap-1">
            {onGoToPos ? (
              <Button
                type="button"
                size="sm"
                className="h-7 min-w-0 flex-1 px-2 text-[10px]"
                onClick={onGoToPos}
              >
                <span className="truncate">Continue POS</span>
              </Button>
            ) : null}
            {onCancelBilling ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="h-7 min-w-0 flex-1 px-2 text-[10px]"
                onClick={onCancelBilling}
                disabled={cancellingBilling}
              >
                <span className="truncate">
                  {cancellingBilling ? "Cancelling…" : "Resume edit"}
                </span>
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function SlipIconAction({
  children,
  label,
  onClick,
  disabled,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex h-6 w-6 items-center justify-center rounded border border-transparent text-[var(--color-muted)] transition-colors",
        disabled
          ? "cursor-not-allowed opacity-40"
          : "hover:border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-foreground)]",
      )}
    >
      {children}
    </button>
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
      className="inline-flex h-6 w-6 items-center justify-center rounded text-[var(--color-muted)] hover:bg-[var(--color-cream-100)]"
    >
      {children}
    </button>
  );
}

"use client";

import { AlertCircle, ArrowRight, CheckCircle2, CircleDollarSign, Wallet } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/src/components/ui/button";
import { Field } from "@/src/components/ui/field";
import { Input } from "@/src/components/ui/input";
import { Select } from "@/src/components/ui/select";
import { cn } from "@/src/lib/cn";
import { formatMoney } from "@/src/lib/format-display";
import { parseMoneyInput, roundMoneyStr } from "@/src/lib/money-input";
import type { PurchasePaymentMethod } from "@/src/lib/ap-types";
import { PAYMENT_METHOD_OPTIONS } from "@/src/lib/ap-display";

export type BillPaymentMode = "FULL" | "PARTIAL";

type Props = {
  remainingBalance: number;
  mode: BillPaymentMode;
  onModeChange: (mode: BillPaymentMode) => void;
  amountStr: string;
  onAmountStrChange: (value: string) => void;
  paymentMethod: PurchasePaymentMethod;
  onPaymentMethodChange: (value: PurchasePaymentMethod) => void;
  referenceNumber: string;
  onReferenceNumberChange: (value: string) => void;
  remarks: string;
  onRemarksChange: (value: string) => void;
  bankProofSlot?: ReactNode;
  onSubmit: () => void;
  saving?: boolean;
  disabled?: boolean;
  className?: string;
};

const MODES: { value: BillPaymentMode; label: string; description: string }[] = [
  { value: "FULL", label: "Full balance", description: "Settle entire amount" },
  { value: "PARTIAL", label: "Partial", description: "Pay a custom amount" },
];

function partialPresetAmount(remaining: number, fraction: number): string {
  if (fraction >= 1) {
    return roundMoneyStr(remaining);
  }
  return roundMoneyStr(Math.round(remaining * fraction * 100) / 100);
}

export function RecordBillPaymentSection({
  remainingBalance,
  mode,
  onModeChange,
  amountStr,
  onAmountStrChange,
  paymentMethod,
  onPaymentMethodChange,
  referenceNumber,
  onReferenceNumberChange,
  remarks,
  onRemarksChange,
  bankProofSlot,
  onSubmit,
  saving = false,
  disabled = false,
  className,
}: Props) {
  const roundedRemaining = Math.round(remainingBalance * 100) / 100;
  const parsed = parseMoneyInput(amountStr);
  const payAmount =
    mode === "FULL" ? roundedRemaining : parsed.invalid ? 0 : parsed.amount;
  const afterRemaining = Math.max(0, Math.round((roundedRemaining - payAmount) * 100) / 100);
  const payProgress =
    roundedRemaining > 0 ? Math.min(100, Math.round((payAmount / roundedRemaining) * 100)) : 0;

  const partialInvalid =
    mode === "PARTIAL" &&
    (parsed.invalid || payAmount <= 0 || payAmount >= roundedRemaining - 0.004);

  const isSettled = afterRemaining < 0.005 && payAmount > 0.005;

  const canSubmit =
    !disabled &&
    !saving &&
    roundedRemaining > 0.005 &&
    (mode === "FULL" || (!partialInvalid && payAmount > 0 && payAmount < roundedRemaining + 0.005));

  const handleModeChange = (value: BillPaymentMode) => {
    onModeChange(value);
    if (value === "FULL") {
      onAmountStrChange(roundMoneyStr(roundedRemaining));
    } else {
      onAmountStrChange("");
    }
  };

  return (
    <section className={cn("border-t border-[var(--color-border)] pt-6", className)}>
      <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]">
        {/* Header */}
        <div className="flex flex-col gap-4 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-[var(--color-foreground)]">Record payment</h3>
            <p className="mt-0.5 max-w-md text-xs leading-relaxed text-[var(--color-muted)]">
              Apply a full or partial payment. Outstanding balance updates after each entry.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 shadow-[var(--shadow-sm)]">
            <div className="flex size-9 items-center justify-center rounded-lg bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
              <Wallet className="size-4" strokeWidth={2} aria-hidden />
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-subtle)]">
                Outstanding
              </p>
              <p className="text-lg font-semibold tabular-nums tracking-tight text-[var(--color-foreground)]">
                {formatMoney(roundedRemaining)}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-5 p-4 sm:p-5">
          {/* Segmented control */}
          <div>
            <p className="mb-2 text-xs font-medium text-[var(--color-muted)]">How much are you paying?</p>
            <div
              role="group"
              aria-label="Payment amount type"
              className="grid grid-cols-2 gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-1"
            >
              {MODES.map((item) => {
                const active = mode === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    disabled={disabled || saving}
                    aria-pressed={active}
                    onClick={() => handleModeChange(item.value)}
                    className={cn(
                      "rounded-lg px-3 py-2.5 text-left transition-all duration-200",
                      active
                        ? "bg-[var(--color-surface)] text-[var(--color-foreground)] shadow-[var(--shadow-sm)] ring-1 ring-[var(--color-border)]"
                        : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]",
                      (disabled || saving) && "pointer-events-none opacity-60",
                    )}
                  >
                    <span className="block text-sm font-medium">{item.label}</span>
                    <span className="mt-0.5 block text-[11px] leading-snug opacity-80">
                      {item.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live allocation */}
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)]/40 p-4">
            <div className="mb-3 flex items-center justify-between gap-2 text-xs font-medium text-[var(--color-muted)]">
              <span>Allocation preview</span>
              {isSettled ? (
                <span className="inline-flex items-center gap-1 text-[var(--color-success)]">
                  <CheckCircle2 className="size-3.5" aria-hidden />
                  Bill will be paid
                </span>
              ) : null}
            </div>
            <div className="mb-3 h-2 overflow-hidden rounded-full bg-[var(--color-border)]">
              <div
                className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-300 ease-out"
                style={{ width: `${payProgress}%` }}
              />
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-subtle)]">
                  Outstanding
                </p>
                <p className="mt-0.5 text-sm font-semibold tabular-nums text-[var(--color-foreground)]">
                  {formatMoney(roundedRemaining)}
                </p>
              </div>
              <div className="text-center sm:text-left">
                <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-subtle)]">
                  This payment
                </p>
                <p className="mt-0.5 text-sm font-semibold tabular-nums text-[var(--color-success)]">
                  {formatMoney(payAmount)}
                </p>
              </div>
              <div className="text-right sm:text-left">
                <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-subtle)]">
                  Remaining
                </p>
                <p className="mt-0.5 text-sm font-semibold tabular-nums tone-warning-text">
                  {formatMoney(afterRemaining)}
                </p>
              </div>
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-3">
            {mode === "PARTIAL" ? (
              <>
                <Field
                  id="bill-partial-amt"
                  label="Amount to pay"
                  required
                  hint={`Enter any amount up to ${formatMoney(roundedRemaining)}`}
                >
                  <div className="relative">
                    <CircleDollarSign
                      className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--color-subtle)]"
                      aria-hidden
                    />
                    <Input
                      value={amountStr}
                      onChange={(e) => onAmountStrChange(e.target.value)}
                      inputMode="decimal"
                      placeholder="0.00"
                      disabled={disabled || saving}
                      className="pl-9 text-base font-medium tabular-nums"
                    />
                  </div>
                </Field>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "25%", fraction: 0.25 },
                    { label: "50%", fraction: 0.5 },
                    { label: "75%", fraction: 0.75 },
                  ].map((chip) => (
                    <button
                      key={chip.label}
                      type="button"
                      disabled={disabled || saving}
                      onClick={() => onAmountStrChange(partialPresetAmount(roundedRemaining, chip.fraction))}
                      className={cn(
                        "rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-xs font-medium text-[var(--color-muted)] transition-colors",
                        "hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-nav-active-text)]",
                        (disabled || saving) && "pointer-events-none opacity-50",
                      )}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
                {partialInvalid && amountStr.trim() !== "" ? (
                  <p className="flex items-start gap-1.5 text-xs text-[var(--color-danger)]">
                    <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                    Amount must be greater than zero and less than the outstanding balance.
                  </p>
                ) : null}
              </>
            ) : (
              <div className="flex items-center justify-between gap-4 rounded-xl border border-dashed border-[var(--color-primary)]/40 bg-[var(--color-primary-soft)]/50 px-4 py-4">
                <div>
                  <p className="text-xs font-medium text-[var(--color-muted)]">Amount to pay</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-[var(--color-foreground)]">
                    {formatMoney(roundedRemaining)}
                  </p>
                </div>
                <ArrowRight className="size-5 text-[var(--color-primary)] opacity-60" aria-hidden />
              </div>
            )}
          </div>

          {/* Payment details */}
          <div className="space-y-4 border-t border-[var(--color-border)] pt-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-subtle)]">
              Payment details
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="bill-pay-method" label="Method" required>
                <Select
                  searchable={false}
                  value={paymentMethod}
                  onChange={(e) => onPaymentMethodChange(e.target.value as PurchasePaymentMethod)}
                  disabled={disabled || saving}
                >
                  {PAYMENT_METHOD_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field id="bill-pay-ref" label="Reference">
                <Input
                  value={referenceNumber}
                  onChange={(e) => onReferenceNumberChange(e.target.value)}
                  disabled={disabled || saving}
                  placeholder="Txn ID, cheque no."
                />
              </Field>
              <Field id="bill-pay-remarks" label="Remarks" className="sm:col-span-2">
                <textarea
                  id="bill-pay-remarks"
                  value={remarks}
                  onChange={(e) => onRemarksChange(e.target.value)}
                  disabled={disabled || saving}
                  rows={2}
                  placeholder="e.g. Partial payment after supplier agreement"
                  className={cn(
                    "w-full resize-y rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-foreground)]",
                    "placeholder:text-[var(--color-subtle)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-[var(--color-primary)]",
                    "disabled:cursor-not-allowed disabled:opacity-60",
                  )}
                />
              </Field>
            </div>
            {bankProofSlot ? <div className="rounded-lg border border-[var(--color-border)] p-3">{bankProofSlot}</div> : null}
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse gap-2 border-t border-[var(--color-border)] bg-[var(--color-surface-muted)]/40 px-4 py-3 sm:flex-row sm:justify-end sm:px-5">
          <Button
            type="button"
            size="sm"
            className="w-full sm:w-auto sm:min-w-[10rem]"
            onClick={onSubmit}
            loading={saving}
            disabled={!canSubmit}
          >
            {mode === "FULL" ? "Record full payment" : "Record partial payment"}
          </Button>
        </div>
      </div>
    </section>
  );
}

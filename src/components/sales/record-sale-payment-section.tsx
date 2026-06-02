"use client";

import { AlertCircle, ArrowRight, CheckCircle2, CircleDollarSign, Wallet } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Field } from "@/src/components/ui/field";
import { Input } from "@/src/components/ui/input";
import { Select } from "@/src/components/ui/select";
import { cn } from "@/src/lib/cn";
import type { SalePaymentMethod } from "@/src/lib/ar-types";
import { SALE_PAYMENT_METHOD_OPTIONS } from "@/src/lib/ar-display";
import { formatMoney } from "@/src/lib/format-display";
import { parseMoneyInput, roundMoneyStr } from "@/src/lib/money-input";

export type SalePaymentMode = "FULL" | "PARTIAL";

type Props = {
  remainingBalance: number;
  mode: SalePaymentMode;
  onModeChange: (mode: SalePaymentMode) => void;
  amountStr: string;
  onAmountStrChange: (value: string) => void;
  paymentMethod: SalePaymentMethod;
  onPaymentMethodChange: (value: SalePaymentMethod) => void;
  referenceNumber: string;
  onReferenceNumberChange: (value: string) => void;
  chequeBankName: string;
  onChequeBankNameChange: (value: string) => void;
  remarks: string;
  onRemarksChange: (value: string) => void;
  onSubmit: () => void;
  saving?: boolean;
  disabled?: boolean;
  className?: string;
};

const MODES: { value: SalePaymentMode; label: string; description: string }[] = [
  { value: "FULL", label: "Full balance", description: "Settle entire amount" },
  { value: "PARTIAL", label: "Partial", description: "Pay a custom amount" },
];

function partialPresetAmount(remaining: number, fraction: number): string {
  if (fraction >= 1) return roundMoneyStr(remaining);
  return roundMoneyStr(Math.round(remaining * fraction * 100) / 100);
}

export function RecordSalePaymentSection({
  remainingBalance,
  mode,
  onModeChange,
  amountStr,
  onAmountStrChange,
  paymentMethod,
  onPaymentMethodChange,
  referenceNumber,
  onReferenceNumberChange,
  chequeBankName,
  onChequeBankNameChange,
  remarks,
  onRemarksChange,
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

  const partialInvalid =
    mode === "PARTIAL" &&
    (parsed.invalid || payAmount <= 0 || payAmount >= roundedRemaining - 0.004);

  const chequeInvalid =
    paymentMethod === "CHEQUE" &&
    (chequeBankName.trim().length < 2 || !referenceNumber.trim());

  const canSubmit =
    !disabled &&
    !saving &&
    roundedRemaining > 0.005 &&
    !chequeInvalid &&
    (mode === "FULL" || (!partialInvalid && payAmount > 0));

  const handleModeChange = (value: SalePaymentMode) => {
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
        <div className="border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]/60 px-4 py-4 sm:px-5">
          <div className="flex items-center gap-2">
            <Wallet className="size-5 text-[var(--color-primary)]" aria-hidden />
            <div>
              <h3 className="text-sm font-semibold text-foreground">Record payment</h3>
              <p className="text-xs text-muted">
                Outstanding:{" "}
                <span className="font-mono font-semibold tabular-nums text-foreground">
                  {formatMoney(roundedRemaining)}
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-5 p-4 sm:p-5">
          <div className="grid gap-2 sm:grid-cols-2">
            {MODES.map((m) => (
              <button
                key={m.value}
                type="button"
                disabled={disabled || saving}
                onClick={() => handleModeChange(m.value)}
                className={cn(
                  "rounded-xl border px-3 py-3 text-left transition-colors",
                  mode === m.value
                    ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]"
                    : "border-[var(--color-border)] hover:border-[var(--color-input)]",
                )}
              >
                <p className="text-sm font-medium">{m.label}</p>
                <p className="text-xs text-muted">{m.description}</p>
              </button>
            ))}
          </div>

          {mode === "PARTIAL" ? (
            <Field id="sale-partial-amt" label="Amount to pay" required>
              <Input
                value={amountStr}
                onChange={(e) => onAmountStrChange(e.target.value)}
                inputMode="decimal"
                disabled={disabled || saving}
                className="font-mono tabular-nums"
              />
            </Field>
          ) : (
            <div className="flex items-center justify-between gap-4 rounded-xl border border-dashed border-[var(--color-primary)]/40 bg-[var(--color-primary-soft)]/50 px-4 py-4">
              <div>
                <p className="text-xs text-muted">Amount to pay</p>
                <p className="text-2xl font-semibold tabular-nums">{formatMoney(roundedRemaining)}</p>
              </div>
              <ArrowRight className="size-5 text-[var(--color-primary)] opacity-60" aria-hidden />
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="sale-pay-method" label="Method" required>
              <Select
                value={paymentMethod}
                onChange={(e) => onPaymentMethodChange(e.target.value as SalePaymentMethod)}
                disabled={disabled || saving}
              >
                {SALE_PAYMENT_METHOD_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </Field>
            {paymentMethod === "CHEQUE" ? (
              <>
                <Field id="sale-cheque-bank" label="Bank name" required>
                  <Input
                    value={chequeBankName}
                    onChange={(e) => onChequeBankNameChange(e.target.value)}
                    disabled={disabled || saving}
                  />
                </Field>
                <Field id="sale-cheque-no" label="Cheque number" required>
                  <Input
                    value={referenceNumber}
                    onChange={(e) => onReferenceNumberChange(e.target.value)}
                    disabled={disabled || saving}
                  />
                </Field>
              </>
            ) : (
              <Field
                id="sale-pay-ref"
                label={paymentMethod === "BANK_TRANSFER" ? "Reference (optional)" : "Reference"}
              >
                <Input
                  value={referenceNumber}
                  onChange={(e) => onReferenceNumberChange(e.target.value)}
                  disabled={disabled || saving}
                  placeholder="Txn ID"
                />
              </Field>
            )}
            <Field id="sale-pay-remarks" label="Remarks" className="sm:col-span-2">
              <Input
                value={remarks}
                onChange={(e) => onRemarksChange(e.target.value)}
                disabled={disabled || saving}
              />
            </Field>
          </div>

          {chequeInvalid ? (
            <p className="flex items-center gap-1.5 text-xs text-[var(--color-danger)]">
              <AlertCircle className="size-3.5" aria-hidden />
              Bank name and cheque number are required
            </p>
          ) : null}

          {canSubmit ? (
            <p className="flex items-center gap-1.5 text-xs text-muted">
              <CheckCircle2 className="size-3.5 text-[var(--color-success)]" aria-hidden />
              After payment: {formatMoney(afterRemaining)} remaining
            </p>
          ) : null}
        </div>

        <div className="border-t border-[var(--color-border)] bg-[var(--color-surface-muted)]/40 px-4 py-3 sm:flex sm:justify-end sm:px-5">
          <Button
            type="button"
            size="sm"
            disabled={!canSubmit}
            loading={saving}
            onClick={onSubmit}
            className="w-full sm:w-auto"
          >
            <CircleDollarSign className="size-4" aria-hidden />
            Record payment
          </Button>
        </div>
      </div>
    </section>
  );
}

"use client";

import { AlertCircle, Banknote, Building2, CheckCircle2, Split } from "lucide-react";
import { type ReactNode, useEffect, useMemo } from "react";
import { NumberInput } from "@/src/components/ui/number-input";
import { cn } from "@/src/lib/cn";
import { formatMoney } from "@/src/lib/format-display";
import {
  parseMoneyInput,
  roundMoneyStr,
  type PurchaseBillingType,
} from "@/src/lib/money-input";

type PaymentPreset = "CASH" | "BANK" | "BOTH";

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]";

type SplitPaymentSectionProps = {
  grandTotal: number;
  billingType: PurchaseBillingType;
  onBillingTypeChange: (value: PurchaseBillingType) => void;
  cashPaidStr: string;
  onCashPaidStrChange: (value: string) => void;
  bankPaidStr: string;
  onBankPaidStrChange: (value: string) => void;
  disabled?: boolean;
  idPrefix?: string;
  /** Optional slot for bank transfer proof (e.g. ImageUploadField) */
  bankProofSlot?: ReactNode;
  showBankProofHint?: boolean;
};

export function SplitPaymentSection({
  grandTotal,
  billingType,
  onBillingTypeChange,
  cashPaidStr,
  onCashPaidStrChange,
  bankPaidStr,
  onBankPaidStrChange,
  disabled = false,
  idPrefix = "payment",
  bankProofSlot,
  showBankProofHint = false,
}: SplitPaymentSectionProps) {
  useEffect(() => {
    if (billingType === "PAID") {
      onCashPaidStrChange(roundMoneyStr(grandTotal));
      onBankPaidStrChange("0");
    }
  }, [grandTotal, billingType, onCashPaidStrChange, onBankPaidStrChange]);

  const cashPaidResult = useMemo(() => parseMoneyInput(cashPaidStr), [cashPaidStr]);
  const bankPaidResult = useMemo(() => parseMoneyInput(bankPaidStr), [bankPaidStr]);

  const creditPreview = useMemo(() => {
    if (cashPaidResult.invalid || bankPaidResult.invalid) {
      return 0;
    }
    return Math.round((grandTotal - cashPaidResult.amount - bankPaidResult.amount) * 100) / 100;
  }, [grandTotal, cashPaidResult, bankPaidResult]);

  const setAllCashPayment = () => {
    onCashPaidStrChange(roundMoneyStr(grandTotal));
    onBankPaidStrChange("0");
  };

  const setAllBankPayment = () => {
    onCashPaidStrChange("0");
    onBankPaidStrChange(roundMoneyStr(grandTotal));
  };

  const setSplitHalfPayment = () => {
    if (billingType === "CREDIT") {
      const paidNow = Math.floor((grandTotal * 100) / 2) / 100;
      const cashHalf = Math.floor((paidNow * 100) / 2) / 100;
      const bankHalf = Math.round((paidNow - cashHalf) * 100) / 100;
      onCashPaidStrChange(roundMoneyStr(cashHalf));
      onBankPaidStrChange(roundMoneyStr(bankHalf));
      return;
    }
    const cashHalf = Math.floor((grandTotal * 100) / 2) / 100;
    const bankHalf = Math.round((grandTotal - cashHalf) * 100) / 100;
    onCashPaidStrChange(roundMoneyStr(cashHalf));
    onBankPaidStrChange(roundMoneyStr(bankHalf));
  };

  const detectedPaymentPreset = useMemo((): PaymentPreset | "CUSTOM" => {
    if (grandTotal <= 0) return "CUSTOM";
    const cash = cashPaidResult.amount;
    const bank = bankPaidResult.amount;
    const sum = Math.round((cash + bank) * 100);
    const grand = Math.round(grandTotal * 100);

    if (billingType === "CREDIT") {
      const paidNow = Math.floor(grand / 2);
      const cashHalf = Math.floor(paidNow / 2);
      const bankHalf = paidNow - cashHalf;
      if (Math.round(cash * 100) === cashHalf && Math.round(bank * 100) === bankHalf) {
        return "BOTH";
      }
      if (bank < 0.005 && cash > 0.005) return "CASH";
      if (cash < 0.005 && bank > 0.005) return "BANK";
      return "CUSTOM";
    }

    if (sum !== grand) return "CUSTOM";
    if (bank < 0.005) return "CASH";
    if (cash < 0.005) return "BANK";
    const half = Math.floor(grand / 2);
    if (Math.round(cash * 100) === half && Math.round(bank * 100) === grand - half) {
      return "BOTH";
    }
    return "CUSTOM";
  }, [billingType, cashPaidResult.amount, bankPaidResult.amount, grandTotal]);

  const paymentCollected = cashPaidResult.amount + bankPaidResult.amount;
  const paymentRemainder =
    billingType === "PAID" ? grandTotal - paymentCollected : creditPreview;
  const paymentBalanced =
    billingType === "PAID"
      ? Math.abs(paymentRemainder) < 0.005
      : creditPreview > 0 && paymentCollected <= grandTotal + 0.005;

  const fillBankFromCash = () => {
    const c = parseMoneyInput(cashPaidStr);
    if (c.invalid) return;
    onBankPaidStrChange(roundMoneyStr(grandTotal - c.amount));
  };

  const fillCashFromBank = () => {
    const b = parseMoneyInput(bankPaidStr);
    if (b.invalid) return;
    onCashPaidStrChange(roundMoneyStr(grandTotal - b.amount));
  };

  const handleBillingTypeChange = (next: PurchaseBillingType) => {
    onBillingTypeChange(next);
    if (next === "PAID") {
      onCashPaidStrChange(roundMoneyStr(grandTotal));
      onBankPaidStrChange("0");
    } else {
      onCashPaidStrChange("0");
      onBankPaidStrChange("0");
    }
  };

  const presetsDisabled = disabled || grandTotal <= 0;
  const hasInvalidInput = cashPaidResult.invalid || bankPaidResult.invalid;

  const presets = [
    { key: "CASH" as const, label: "Cash", icon: Banknote, onClick: setAllCashPayment },
    { key: "BANK" as const, label: "Bank", icon: Building2, onClick: setAllBankPayment },
    { key: "BOTH" as const, label: "Split", icon: Split, onClick: setSplitHalfPayment },
  ];

  return (
    <section className="border-t border-[var(--color-border)] pt-6">
      <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]">
        {/* Header */}
        <div className="flex flex-col gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]/50 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:px-5">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-[var(--color-foreground)]">Payment</h3>
            <p className="mt-0.5 text-xs leading-relaxed text-[var(--color-muted)]">
              Allocate the purchase total across cash, bank, and supplier credit.
            </p>
          </div>
          <div className="shrink-0 sm:text-right">
            <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-subtle)]">
              Purchase total
            </p>
            <p className="mt-0.5 font-mono text-xl font-semibold tabular-nums tracking-tight text-[var(--color-foreground)]">
              {formatMoney(grandTotal)}
            </p>
          </div>
        </div>

        <div className="space-y-5 px-4 py-5 sm:px-5">
          {/* Billing type */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-[var(--color-muted)]">When is this paid?</p>
            <div
              className="inline-flex w-full max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)]/40 p-1"
              role="group"
              aria-label="Payment timing"
            >
              {(
                [
                  { value: "PAID" as const, label: "Paid now" },
                  { value: "CREDIT" as const, label: "On credit" },
                ] as const
              ).map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  disabled={disabled}
                  className={cn(
                    "flex flex-1 items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition-all",
                    focusRing,
                    billingType === value
                      ? "bg-[var(--color-surface)] text-[var(--color-foreground)] shadow-[var(--shadow-sm)] ring-1 ring-[var(--color-border)]"
                      : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]",
                  )}
                  aria-pressed={billingType === value}
                  onClick={() => handleBillingTypeChange(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Method presets */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-[var(--color-muted)]">Quick fill</p>
            <div className="flex flex-wrap gap-2">
              {presets.map(({ key, label, icon: Icon, onClick }) => {
                const active = detectedPaymentPreset === key;
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={presetsDisabled}
                    aria-pressed={active}
                    onClick={onClick}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-all",
                      focusRing,
                      active
                        ? "border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                        : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] hover:border-[var(--color-primary)]/25 hover:text-[var(--color-foreground)]",
                      presetsDisabled && "cursor-not-allowed opacity-50",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount inputs */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)]/30 p-3.5">
              <label
                htmlFor={`${idPrefix}-cash`}
                className="mb-2 flex items-center gap-2 text-xs font-medium text-[var(--color-muted)]"
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full bg-emerald-500"
                  aria-hidden
                />
                Cash paid
              </label>
              <NumberInput
                id={`${idPrefix}-cash`}
                min={0}
                disabled={disabled || grandTotal <= 0}
                value={cashPaidStr}
                onValueChange={onCashPaidStrChange}
                onBlur={billingType === "PAID" ? fillBankFromCash : undefined}
                className="h-11 border-[var(--color-border)] bg-[var(--color-surface)] font-mono text-base tabular-nums"
                placeholder="0.00"
              />
            </div>
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)]/30 p-3.5">
              <label
                htmlFor={`${idPrefix}-bank`}
                className="mb-2 flex items-center gap-2 text-xs font-medium text-[var(--color-muted)]"
              >
                <span className="h-2 w-2 shrink-0 rounded-full bg-sky-500" aria-hidden />
                Bank paid
              </label>
              <NumberInput
                id={`${idPrefix}-bank`}
                min={0}
                disabled={disabled || grandTotal <= 0}
                value={bankPaidStr}
                onValueChange={onBankPaidStrChange}
                onBlur={billingType === "PAID" ? fillCashFromBank : undefined}
                className="h-11 border-[var(--color-border)] bg-[var(--color-surface)] font-mono text-base tabular-nums"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Allocation summary */}
          {grandTotal > 0 && !hasInvalidInput ? (
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)]/25 px-3.5 py-3">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[var(--color-muted)]">
                <span>
                  Paid now{" "}
                  <span className="font-mono font-medium tabular-nums text-[var(--color-foreground)]">
                    {formatMoney(paymentCollected)}
                  </span>
                </span>
                <span className="hidden text-[var(--color-subtle)] sm:inline" aria-hidden>
                  ·
                </span>
                <span>
                  {billingType === "CREDIT" ? "On credit" : "Remaining"}{" "}
                  <span className="font-mono font-medium tabular-nums text-[var(--color-foreground)]">
                    {formatMoney(Math.max(0, billingType === "CREDIT" ? creditPreview : paymentRemainder))}
                  </span>
                </span>
                <span className="hidden text-[var(--color-subtle)] sm:inline" aria-hidden>
                  ·
                </span>
                <span>
                  Total{" "}
                  <span className="font-mono font-medium tabular-nums text-[var(--color-foreground)]">
                    {formatMoney(grandTotal)}
                  </span>
                </span>
              </div>

              {grandTotal > 0 ? (
                <div
                  className="mt-3 flex h-1.5 overflow-hidden rounded-full bg-[var(--color-cream-200)]"
                  role="presentation"
                  aria-hidden
                >
                  <div
                    className="bg-emerald-500/80 transition-all duration-300 ease-out"
                    style={{
                      width: `${Math.min(100, (cashPaidResult.amount / grandTotal) * 100)}%`,
                    }}
                  />
                  <div
                    className="bg-sky-500/80 transition-all duration-300 ease-out"
                    style={{
                      width: `${Math.min(100, (bankPaidResult.amount / grandTotal) * 100)}%`,
                    }}
                  />
                  {billingType === "CREDIT" && creditPreview > 0.005 ? (
                    <div
                      className="bg-[var(--color-subtle)]/40 transition-all duration-300 ease-out"
                      style={{
                        width: `${Math.min(100, (creditPreview / grandTotal) * 100)}%`,
                      }}
                    />
                  ) : null}
                </div>
              ) : null}

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {paymentBalanced ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-success)]/10 px-2.5 py-1 text-xs font-medium text-[var(--color-success)]">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    {billingType === "CREDIT" ? "Credit recorded" : "Balanced"}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium tone-warning-surface tone-warning-text">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    {billingType === "CREDIT"
                      ? creditPreview <= 0
                        ? "Add a credit balance or switch to Paid now"
                        : `On credit: ${formatMoney(creditPreview)}`
                      : paymentRemainder > 0
                        ? `Still due: ${formatMoney(paymentRemainder)}`
                        : `Overpaid: ${formatMoney(Math.abs(paymentRemainder))}`}
                  </span>
                )}
                {detectedPaymentPreset === "CUSTOM" && paymentCollected > 0.005 ? (
                  <span className="text-[11px] text-[var(--color-subtle)]">Custom split</span>
                ) : null}
              </div>
            </div>
          ) : null}

          {grandTotal <= 0 ? (
            <p className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-muted)]/30 px-4 py-3 text-center text-xs text-[var(--color-muted)]">
              Add line items above to set payment amounts.
            </p>
          ) : null}

          {/* Bank proof */}
          {showBankProofHint && bankPaidResult.amount > 0.005 ? (
            <div className="space-y-3 border-t border-[var(--color-border)] pt-4">
              <div className="flex items-start gap-2">
                <Building2
                  className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary)]"
                  aria-hidden
                />
                <div>
                  <p className="text-sm font-medium text-[var(--color-foreground)]">
                    Bank transfer proof
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                    Upload a screenshot or receipt for the bank payment.
                  </p>
                </div>
              </div>
              {bankProofSlot}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

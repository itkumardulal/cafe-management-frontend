"use client";

import { AlertCircle, Banknote, Building2, CheckCircle2, Split } from "lucide-react";
import { useEffect, useMemo } from "react";
import { Field } from "@/src/components/ui/field";
import { Input } from "@/src/components/ui/input";
import { Select } from "@/src/components/ui/select";
import { cn } from "@/src/lib/cn";
import type { CheckoutPaymentType, PaymentTermsPreset, SalePaymentMethod } from "@/src/lib/ar-types";
import { SALE_PAYMENT_TERMS_OPTIONS } from "@/src/lib/ar-display";
import { formatMoney } from "@/src/lib/format-display";
import { parseMoneyInput, roundMoneyStr } from "@/src/lib/money-input";

type TenderMode = "CASH" | "BANK" | "CHEQUE" | "SPLIT";

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]";

const paymentPresetClass = (active: boolean) =>
  cn(
    "flex flex-col items-center justify-center gap-1 rounded-xl border px-2 py-3 transition-colors",
    focusRing,
    active
      ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-nav-active-text)]"
      : "border-[var(--color-border)] bg-[var(--color-surface)] text-muted hover:border-[var(--color-input)]",
  );

type Props = {
  grandTotal: number;
  checkoutPaymentType: CheckoutPaymentType;
  onCheckoutPaymentTypeChange: (v: CheckoutPaymentType) => void;
  paidAmountStr: string;
  onPaidAmountStrChange: (v: string) => void;
  tenderMode: TenderMode;
  onTenderModeChange: (v: TenderMode) => void;
  cashPaidStr: string;
  onCashPaidStrChange: (v: string) => void;
  bankPaidStr: string;
  onBankPaidStrChange: (v: string) => void;
  chequeBankName: string;
  onChequeBankNameChange: (v: string) => void;
  chequeNumber: string;
  onChequeNumberChange: (v: string) => void;
  bankReference: string;
  onBankReferenceChange: (v: string) => void;
  paymentTermsPreset: PaymentTermsPreset;
  onPaymentTermsPresetChange: (v: PaymentTermsPreset) => void;
  customDueDate: string;
  onCustomDueDateChange: (v: string) => void;
  disabled?: boolean;
};

export function buildInitialPaymentsFromCheckout(params: {
  checkoutPaymentType: CheckoutPaymentType;
  grandTotal: number;
  paidAmount: number;
  tenderMode: TenderMode;
  cashPaid: number;
  bankPaid: number;
  chequeBankName: string;
  chequeNumber: string;
  bankReference: string;
}): Array<{
  amount: number;
  paymentMethod: SalePaymentMethod;
  referenceNumber?: string;
  chequeBankName?: string;
}> {
  const { checkoutPaymentType, grandTotal, paidAmount, tenderMode } = params;
  if (checkoutPaymentType === "CREDIT" || paidAmount < 0.005) {
    return [];
  }

  const amount =
    checkoutPaymentType === "FULLY_PAID" ? grandTotal : paidAmount;

  if (tenderMode === "SPLIT") {
    const rows: Array<{
      amount: number;
      paymentMethod: SalePaymentMethod;
      referenceNumber?: string;
    }> = [];
    if (params.cashPaid > 0.005) {
      rows.push({ amount: params.cashPaid, paymentMethod: "CASH" });
    }
    if (params.bankPaid > 0.005) {
      rows.push({
        amount: params.bankPaid,
        paymentMethod: "BANK_TRANSFER",
        referenceNumber: params.bankReference.trim() || undefined,
      });
    }
    return rows;
  }

  if (tenderMode === "CASH") {
    return [{ amount, paymentMethod: "CASH" }];
  }
  if (tenderMode === "BANK") {
    return [
      {
        amount,
        paymentMethod: "BANK_TRANSFER",
        referenceNumber: params.bankReference.trim() || undefined,
      },
    ];
  }
  return [
    {
      amount,
      paymentMethod: "CHEQUE",
      chequeBankName: params.chequeBankName.trim(),
      referenceNumber: params.chequeNumber.trim(),
    },
  ];
}

export function PosCheckoutPaymentSection({
  grandTotal,
  checkoutPaymentType,
  onCheckoutPaymentTypeChange,
  paidAmountStr,
  onPaidAmountStrChange,
  tenderMode,
  onTenderModeChange,
  cashPaidStr,
  onCashPaidStrChange,
  bankPaidStr,
  onBankPaidStrChange,
  chequeBankName,
  onChequeBankNameChange,
  chequeNumber,
  onChequeNumberChange,
  bankReference,
  onBankReferenceChange,
  paymentTermsPreset,
  onPaymentTermsPresetChange,
  customDueDate,
  onCustomDueDateChange,
  disabled,
}: Props) {
  const paidResult = parseMoneyInput(paidAmountStr);
  const cashResult = parseMoneyInput(cashPaidStr);
  const bankResult = parseMoneyInput(bankPaidStr);

  const paidNow =
    checkoutPaymentType === "FULLY_PAID"
      ? grandTotal
      : checkoutPaymentType === "CREDIT"
        ? 0
        : paidResult.invalid
          ? 0
          : paidResult.amount;

  const creditPreview = Math.max(0, Math.round((grandTotal - paidNow) * 100) / 100);
  const hasCredit = creditPreview > 0.005;

  useEffect(() => {
    if (checkoutPaymentType === "FULLY_PAID") {
      onPaidAmountStrChange(roundMoneyStr(grandTotal));
      if (tenderMode === "CASH") {
        onCashPaidStrChange(roundMoneyStr(grandTotal));
        onBankPaidStrChange("0");
      } else if (tenderMode === "BANK") {
        onCashPaidStrChange("0");
        onBankPaidStrChange(roundMoneyStr(grandTotal));
      }
    } else if (checkoutPaymentType === "CREDIT") {
      onPaidAmountStrChange("0");
      onCashPaidStrChange("0");
      onBankPaidStrChange("0");
    }
  }, [
    checkoutPaymentType,
    grandTotal,
    tenderMode,
    onPaidAmountStrChange,
    onCashPaidStrChange,
    onBankPaidStrChange,
  ]);

  const splitSum =
    (cashResult.invalid ? 0 : cashResult.amount) + (bankResult.invalid ? 0 : bankResult.amount);

  const tenderBalanced =
    checkoutPaymentType === "CREDIT" ||
    tenderMode === "CASH" ||
    tenderMode === "BANK" ||
    tenderMode === "CHEQUE"
      ? true
      : Math.abs(splitSum - paidNow) < 0.005;

  const chequeValid =
    tenderMode !== "CHEQUE" ||
    (chequeBankName.trim().length >= 2 && chequeNumber.trim().length >= 1);

  const partialValid =
    checkoutPaymentType !== "PARTIALLY_PAID" ||
    (!paidResult.invalid && paidNow > 0 && paidNow < grandTotal - 0.005);

  const paymentBalanced =
    checkoutPaymentType === "FULLY_PAID"
      ? paidNow >= grandTotal - 0.005
      : checkoutPaymentType === "CREDIT"
        ? paidNow < 0.005
        : partialValid;

  const statusOk = paymentBalanced && tenderBalanced && chequeValid;

  const segmentClass = (active: boolean) =>
    cn(
      "flex flex-1 items-center justify-center rounded-md px-2 py-2 text-xs font-medium sm:text-sm",
      focusRing,
      active
        ? "bg-[var(--color-primary)] text-white shadow-sm"
        : "menu-segment-idle",
      disabled && "pointer-events-none opacity-60",
    );

  return (
    <div className="space-y-3">
      <div>
        <p className="mb-1 text-xs text-muted">Payment type</p>
        <div className="flex gap-1 rounded-lg bg-[var(--color-cream-100)] p-1">
          {(
            [
              ["FULLY_PAID", "Paid now"],
              ["PARTIALLY_PAID", "Partial"],
              ["CREDIT", "On credit"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              disabled={disabled || grandTotal <= 0}
              className={segmentClass(checkoutPaymentType === value)}
              onClick={() => onCheckoutPaymentTypeChange(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-cream-50)]/50 p-3 text-sm">
        <div>
          <p className="text-xs text-muted">Total</p>
          <p className="font-mono font-semibold tabular-nums">{formatMoney(grandTotal)}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Paid now</p>
          <p className="font-mono font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
            {formatMoney(paidNow)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted">On credit</p>
          <p className="font-mono font-semibold tabular-nums text-amber-800 dark:text-amber-300">
            {formatMoney(creditPreview)}
          </p>
        </div>
      </div>

      {checkoutPaymentType === "PARTIALLY_PAID" ? (
        <Field id="pos-partial-paid" label="Amount collected now" required>
          <Input
            value={paidAmountStr}
            onChange={(e) => onPaidAmountStrChange(e.target.value)}
            inputMode="decimal"
            disabled={disabled}
            className="h-10 font-mono tabular-nums"
          />
        </Field>
      ) : null}

      {checkoutPaymentType !== "CREDIT" && paidNow > 0.005 ? (
        <>
          <div>
            <p className="mb-1 text-xs text-muted">Payment method</p>
            <div className="grid grid-cols-4 gap-2">
              {(
                [
                  { key: "CASH" as const, label: "Cash", icon: Banknote },
                  { key: "BANK" as const, label: "Bank", icon: Building2 },
                  { key: "CHEQUE" as const, label: "Cheque", icon: Building2 },
                  { key: "SPLIT" as const, label: "Split", icon: Split },
                ] as const
              ).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  disabled={disabled}
                  onClick={() => onTenderModeChange(key)}
                  className={paymentPresetClass(tenderMode === key)}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-[10px] font-semibold sm:text-xs">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {tenderMode === "SPLIT" ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field id="pos-split-cash" label="Cash">
                <Input
                  value={cashPaidStr}
                  onChange={(e) => onCashPaidStrChange(e.target.value)}
                  inputMode="decimal"
                  disabled={disabled}
                  className="h-10 font-mono tabular-nums"
                />
              </Field>
              <Field id="pos-split-bank" label="Bank">
                <Input
                  value={bankPaidStr}
                  onChange={(e) => onBankPaidStrChange(e.target.value)}
                  inputMode="decimal"
                  disabled={disabled}
                  className="h-10 font-mono tabular-nums"
                />
              </Field>
              <Field id="pos-split-bank-ref" label="Bank reference (optional)" className="sm:col-span-2">
                <Input
                  value={bankReference}
                  onChange={(e) => onBankReferenceChange(e.target.value)}
                  disabled={disabled}
                  placeholder="Transaction ID"
                />
              </Field>
            </div>
          ) : null}

          {tenderMode === "BANK" ? (
            <Field id="pos-bank-ref" label="Bank reference (optional)">
              <Input
                value={bankReference}
                onChange={(e) => onBankReferenceChange(e.target.value)}
                disabled={disabled}
                placeholder="Transaction ID"
              />
            </Field>
          ) : null}

          {tenderMode === "CHEQUE" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field id="pos-cheque-bank" label="Bank name" required>
                <Input
                  value={chequeBankName}
                  onChange={(e) => onChequeBankNameChange(e.target.value)}
                  disabled={disabled}
                  placeholder="e.g. Nabil Bank"
                />
              </Field>
              <Field id="pos-cheque-no" label="Cheque number" required>
                <Input
                  value={chequeNumber}
                  onChange={(e) => onChequeNumberChange(e.target.value)}
                  disabled={disabled}
                  placeholder="Cheque no."
                />
              </Field>
            </div>
          ) : null}
        </>
      ) : null}

      {hasCredit ? (
        <div className="space-y-2 rounded-lg border border-[var(--color-border)] p-3">
          <p className="text-xs font-medium text-foreground">Payment terms</p>
          <Select
            value={paymentTermsPreset}
            onChange={(e) => onPaymentTermsPresetChange(e.target.value as PaymentTermsPreset)}
            disabled={disabled}
          >
            {SALE_PAYMENT_TERMS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          {paymentTermsPreset === "CUSTOM" ? (
            <Field id="pos-due-date" label="Due date" required>
              <Input
                type="date"
                value={customDueDate}
                onChange={(e) => onCustomDueDateChange(e.target.value)}
                disabled={disabled}
              />
            </Field>
          ) : null}
        </div>
      ) : null}

      {grandTotal > 0 ? (
        <div className="space-y-1">
          <div className="flex h-2 overflow-hidden rounded-full bg-[var(--color-cream-200)]">
            <div
              className="bg-emerald-600 transition-all"
              style={{ width: `${Math.min(100, (paidNow / grandTotal) * 100)}%` }}
            />
            <div
              className="bg-amber-500 transition-all"
              style={{ width: `${Math.min(100, (creditPreview / grandTotal) * 100)}%` }}
            />
          </div>
        </div>
      ) : null}

      <div
        className={cn(
          "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm",
          statusOk
            ? "bg-green-500/10 text-green-800 dark:text-green-300"
            : "bg-amber-500/10 text-amber-900 dark:text-amber-200",
        )}
      >
        {statusOk ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
        <span className="leading-snug">
          {statusOk
            ? creditPreview > 0.005
              ? `On credit: ${formatMoney(creditPreview)}`
              : "Payment matches total"
            : !chequeValid
              ? "Enter bank name and cheque number"
              : !partialValid
                ? "Partial payment must be greater than zero and less than total"
                : !tenderBalanced
                  ? "Cash and bank must add up to amount collected"
                  : "Complete payment details"}
        </span>
      </div>
    </div>
  );
}

export function useCheckoutPaymentValidation(params: {
  checkoutPaymentType: CheckoutPaymentType;
  grandTotal: number;
  paidAmountStr: string;
  tenderMode: TenderMode;
  cashPaidStr: string;
  bankPaidStr: string;
  chequeBankName: string;
  chequeNumber: string;
}): boolean {
  const paidResult = parseMoneyInput(params.paidAmountStr);
  const cashResult = parseMoneyInput(params.cashPaidStr);
  const bankResult = parseMoneyInput(params.bankPaidStr);

  const paidNow =
    params.checkoutPaymentType === "FULLY_PAID"
      ? params.grandTotal
      : params.checkoutPaymentType === "CREDIT"
        ? 0
        : paidResult.invalid
          ? 0
          : paidResult.amount;

  if (params.checkoutPaymentType === "PARTIALLY_PAID") {
    if (paidResult.invalid || paidNow <= 0 || paidNow >= params.grandTotal - 0.005) {
      return false;
    }
  }
  if (params.checkoutPaymentType === "FULLY_PAID" && paidNow < params.grandTotal - 0.005) {
    return false;
  }
  if (params.checkoutPaymentType === "CREDIT" && paidNow > 0.005) {
    return false;
  }

  if (paidNow > 0.005) {
    if (params.tenderMode === "CHEQUE") {
      if (params.chequeBankName.trim().length < 2 || !params.chequeNumber.trim()) {
        return false;
      }
    }
    if (params.tenderMode === "SPLIT") {
      if (cashResult.invalid || bankResult.invalid) return false;
      if (Math.abs(cashResult.amount + bankResult.amount - paidNow) > 0.005) return false;
    }
  }

  return true;
}

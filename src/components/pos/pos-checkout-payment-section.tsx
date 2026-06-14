"use client";

import Link from "next/link";
import { AlertCircle, Banknote, Building2, CheckCircle2, Split } from "lucide-react";
import { useEffect } from "react";
import { Field } from "@/src/components/ui/field";
import { Input } from "@/src/components/ui/input";
import { Select } from "@/src/components/ui/select";
import { cn } from "@/src/lib/cn";
import type { CheckoutPaymentType, SalePaymentMethod } from "@/src/lib/ar-types";
import { formatMoney } from "@/src/lib/format-display";
import { parseMoneyInput, roundMoneyStr } from "@/src/lib/money-input";

export type BankAccountOption = {
  id: string;
  bankName: string;
  accountNumber: string;
  label: string;
};

type TenderMode = "CASH" | "BANK" | "SPLIT";

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
  bankAccountId: string;
  onBankAccountIdChange: (v: string) => void;
  bankAccounts: BankAccountOption[];
  disabled?: boolean;
  allowCredit?: boolean;
};

export function buildInitialPaymentsFromCheckout(params: {
  checkoutPaymentType: CheckoutPaymentType;
  grandTotal: number;
  paidAmount: number;
  tenderMode: TenderMode;
  cashPaid: number;
  bankPaid: number;
  bankAccountId: string;
}): Array<{
  amount: number;
  paymentMethod: SalePaymentMethod;
  bankAccountId?: string;
}> {
  const { checkoutPaymentType, paidAmount, tenderMode } = params;
  if (checkoutPaymentType === "CREDIT" || paidAmount < 0.005) {
    return [];
  }

  const amount = paidAmount;
  const bankAccountId = params.bankAccountId.trim() || undefined;

  if (tenderMode === "SPLIT") {
    const rows: Array<{
      amount: number;
      paymentMethod: SalePaymentMethod;
      bankAccountId?: string;
    }> = [];
    if (params.cashPaid > 0.005) {
      rows.push({ amount: params.cashPaid, paymentMethod: "CASH" });
    }
    if (params.bankPaid > 0.005) {
      rows.push({
        amount: params.bankPaid,
        paymentMethod: "BANK_TRANSFER",
        bankAccountId,
      });
    }
    return rows;
  }

  if (tenderMode === "CASH") {
    return [{ amount, paymentMethod: "CASH" }];
  }
  return [
    {
      amount,
      paymentMethod: "BANK_TRANSFER",
      bankAccountId,
    },
  ];
}

function needsBankAccount(tenderMode: TenderMode, bankPaid: number): boolean {
  return tenderMode === "BANK" || (tenderMode === "SPLIT" && bankPaid > 0.005);
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
  bankAccountId,
  onBankAccountIdChange,
  bankAccounts,
  disabled,
  allowCredit = true,
}: Props) {
  const paidResult = parseMoneyInput(paidAmountStr);
  const cashResult = parseMoneyInput(cashPaidStr);
  const bankResult = parseMoneyInput(bankPaidStr);
  const bankPaidAmount = bankResult.invalid ? 0 : bankResult.amount;

  const paidNow =
    checkoutPaymentType === "FULLY_PAID"
      ? tenderMode === "CASH"
        ? cashResult.invalid
          ? 0
          : cashResult.amount
        : tenderMode === "SPLIT"
          ? (cashResult.invalid ? 0 : cashResult.amount) +
            (bankResult.invalid ? 0 : bankResult.amount)
          : grandTotal
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
        const currentCash = parseMoneyInput(cashPaidStr);
        const currentCashAmount = currentCash.invalid ? 0 : currentCash.amount;
        if (currentCashAmount < 0.005 && grandTotal > 0.005) {
          onCashPaidStrChange(roundMoneyStr(grandTotal));
        }
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
    cashPaidStr,
  ]);

  const splitSum =
    (cashResult.invalid ? 0 : cashResult.amount) + (bankResult.invalid ? 0 : bankResult.amount);

  const tenderBalanced =
    checkoutPaymentType === "CREDIT" ||
    tenderMode === "CASH" ||
    tenderMode === "BANK"
      ? true
      : Math.abs(splitSum - paidNow) < 0.005;

  const bankAccountRequired = needsBankAccount(tenderMode, bankPaidAmount);
  const bankAccountValid =
    !bankAccountRequired || (bankAccountId.trim().length > 0 && bankAccounts.length > 0);

  const partialValid =
    checkoutPaymentType !== "PARTIALLY_PAID" ||
    (!paidResult.invalid && paidNow > 0 && paidNow < grandTotal - 0.005);

  const fullPaidValid =
    checkoutPaymentType !== "FULLY_PAID" || paidNow >= grandTotal - 0.005;

  const paymentBalanced =
    checkoutPaymentType === "FULLY_PAID"
      ? fullPaidValid
      : checkoutPaymentType === "CREDIT"
        ? paidNow < 0.005
        : partialValid;

  const changePreview =
    checkoutPaymentType === "FULLY_PAID"
      ? Math.max(0, Math.round((paidNow - grandTotal) * 100) / 100)
      : 0;

  const statusOk = paymentBalanced && tenderBalanced && bankAccountValid;

  const segmentClass = (active: boolean) =>
    cn(
      "flex flex-1 items-center justify-center rounded-md px-2 py-2 text-xs font-medium sm:text-sm",
      focusRing,
      active
        ? "bg-[var(--color-primary)] text-white shadow-sm"
        : "menu-segment-idle",
      disabled && "pointer-events-none opacity-60",
    );

  const paymentTypeOptions = (
    [
      ["FULLY_PAID", "Paid now"],
      ...(allowCredit
        ? ([
            ["PARTIALLY_PAID", "Partial"],
            ["CREDIT", "On credit"],
          ] as const)
        : []),
    ] as const
  ) satisfies ReadonlyArray<readonly [CheckoutPaymentType, string]>;

  const bankAccountField = bankAccountRequired ? (
    <Field id="pos-bank-account" label="Bank account" required>
      {bankAccounts.length === 0 ? (
        <p className="text-sm text-muted">
          No active bank accounts.{" "}
          <Link href="/banks" className="font-medium text-[var(--color-primary)] hover:underline">
            Add a bank account
          </Link>
        </p>
      ) : (
        <Select
          searchable
          value={bankAccountId}
          onChange={(e) => onBankAccountIdChange(e.target.value)}
          disabled={disabled}
        >
          <option value="">Choose account</option>
          {bankAccounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label}
            </option>
          ))}
        </Select>
      )}
    </Field>
  ) : null;

  return (
    <div className="space-y-3">
      <div>
        <p className="mb-1 text-xs text-muted">Payment type</p>
        <div className="flex gap-1 rounded-lg bg-[var(--color-cream-100)] p-1">
          {paymentTypeOptions.map(([value, label]) => (
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

      <div className="grid grid-cols-2 gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-cream-50)]/50 p-3 text-sm sm:grid-cols-4">
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
          <p className="font-mono font-semibold tabular-nums tone-warning-text">
            {formatMoney(creditPreview)}
          </p>
        </div>
        {checkoutPaymentType === "FULLY_PAID" ? (
          <div>
            <p className="text-xs text-muted">Change</p>
            <p className="font-mono font-semibold tabular-nums text-sky-700 dark:text-sky-300">
              {formatMoney(changePreview)}
            </p>
          </div>
        ) : null}
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

      {checkoutPaymentType !== "CREDIT" && grandTotal > 0.005 ? (
        <>
          <div>
            <p className="mb-1 text-xs text-muted">Payment method</p>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { key: "CASH" as const, label: "Cash", icon: Banknote },
                  { key: "BANK" as const, label: "Bank", icon: Building2 },
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

          {tenderMode === "CASH" ? (
            <Field id="pos-cash-received" label="Cash received" required>
              <Input
                value={cashPaidStr}
                onChange={(e) => onCashPaidStrChange(e.target.value)}
                inputMode="decimal"
                disabled={disabled}
                className="h-10 font-mono tabular-nums"
              />
            </Field>
          ) : null}

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
              {bankPaidAmount > 0.005 ? (
                <div className="sm:col-span-2">{bankAccountField}</div>
              ) : null}
            </div>
          ) : null}

          {tenderMode === "BANK" ? bankAccountField : null}
        </>
      ) : null}

      {grandTotal > 0 ? (
        <div className="space-y-1">
          <div className="flex h-2 overflow-hidden rounded-full bg-[var(--color-cream-200)]">
            <div
              className="bg-emerald-600 transition-all"
              style={{ width: `${Math.min(100, (paidNow / grandTotal) * 100)}%` }}
            />
            <div
              className="bg-[var(--color-warning)] transition-all"
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
            : "tone-warning-banner",
        )}
      >
        {statusOk ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
        <span className="leading-snug">
          {statusOk
            ? hasCredit
              ? `On credit: ${formatMoney(creditPreview)}`
              : "Payment matches total"
            : !bankAccountValid
              ? bankAccounts.length === 0
                ? "Add a bank account before accepting bank payments"
                : "Select a bank account"
              : !fullPaidValid
                ? "Collected amount cannot be less than total"
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
  bankAccountId: string;
  bankAccountsCount: number;
}): boolean {
  const paidResult = parseMoneyInput(params.paidAmountStr);
  const cashResult = parseMoneyInput(params.cashPaidStr);
  const bankResult = parseMoneyInput(params.bankPaidStr);
  const bankPaid = bankResult.invalid ? 0 : bankResult.amount;

  const paidNow =
    params.checkoutPaymentType === "FULLY_PAID"
      ? params.tenderMode === "CASH"
        ? cashResult.invalid
          ? 0
          : cashResult.amount
        : params.tenderMode === "SPLIT"
          ? (cashResult.invalid ? 0 : cashResult.amount) + (bankResult.invalid ? 0 : bankResult.amount)
          : params.grandTotal
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
    if (needsBankAccount(params.tenderMode, bankPaid)) {
      if (!params.bankAccountId.trim() || params.bankAccountsCount === 0) {
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

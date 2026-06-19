"use client";

import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Field } from "@/src/components/ui/field";
import { Input } from "@/src/components/ui/input";
import { Select } from "@/src/components/ui/select";
import { cn } from "@/src/lib/cn";
import { formatMoney } from "@/src/lib/format-display";
import { parseMoneyInput } from "@/src/lib/money-input";
import type { CreatePaymentType, PurchasePaymentMethod } from "@/src/lib/ap-types";
import { PAYMENT_METHOD_OPTIONS } from "@/src/lib/ap-display";

export type PurchaseBankAccountOption = {
  id: string;
  bankName: string;
  accountNumber: string;
  label: string;
};

type Props = {
  grandTotal: number;
  paymentType: CreatePaymentType;
  onPaymentTypeChange: (v: CreatePaymentType) => void;
  paidAmountStr: string;
  onPaidAmountStrChange: (v: string) => void;
  paymentMethod: PurchasePaymentMethod;
  onPaymentMethodChange: (v: PurchasePaymentMethod) => void;
  bankAccountId: string;
  onBankAccountIdChange: (v: string) => void;
  bankAccounts: PurchaseBankAccountOption[];
  remarks: string;
  onRemarksChange: (v: string) => void;
  bankProofSlot?: React.ReactNode;
  disabled?: boolean;
};

export function PurchasePaymentTypeSection({
  grandTotal,
  paymentType,
  onPaymentTypeChange,
  paidAmountStr,
  onPaidAmountStrChange,
  paymentMethod,
  onPaymentMethodChange,
  bankAccountId,
  onBankAccountIdChange,
  bankAccounts,
  remarks,
  onRemarksChange,
  bankProofSlot,
  disabled,
}: Props) {
  const paidResult = parseMoneyInput(paidAmountStr);
  const paid =
    paymentType === "FULLY_PAID"
      ? grandTotal
      : paymentType === "CREDIT"
        ? 0
        : paidResult.invalid
          ? 0
          : paidResult.amount;
  const remaining = Math.max(0, Math.round((grandTotal - paid) * 100) / 100);
  const showBankFields = paymentMethod === "BANK_TRANSFER";

  return (
    <div className="space-y-4 rounded-lg border border-(--color-border) bg-surface-muted/50 p-4">
      <p className="text-sm font-medium text-foreground">Payment</p>

      <div className="grid gap-2 sm:grid-cols-3">
        {(
          [
            ["FULLY_PAID", "Fully paid"],
            ["PARTIALLY_PAID", "Partially paid"],
            ["CREDIT", "Credit"],
          ] as const
        ).map(([value, label]) => (
          <label
            key={value}
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm",
              paymentType === value
                ? "border-primary bg-primary-soft text-foreground"
                : "border-(--color-border) bg-surface",
              disabled && "opacity-60 pointer-events-none",
            )}
          >
            <input
              type="radio"
              name="paymentType"
              className="accent-primary"
              checked={paymentType === value}
              disabled={disabled}
              onChange={() => onPaymentTypeChange(value)}
            />
            {label}
          </label>
        ))}
      </div>

      <div className="form-grid form-grid-cols-3 text-sm">
        <div>
          <p className="text-subtle">Total</p>
          <p className="font-semibold tabular-nums">{formatMoney(grandTotal)}</p>
        </div>
        <div>
          <p className="text-subtle">Paid</p>
          <p className="font-semibold tabular-nums text-success">{formatMoney(paid)}</p>
        </div>
        <div>
          <p className="text-subtle">Remaining</p>
          <p className="font-semibold tabular-nums text-warning">{formatMoney(remaining)}</p>
        </div>
      </div>

      {paymentType === "FULLY_PAID" || paymentType === "PARTIALLY_PAID" ? (
        <div className="space-y-3 border-t border-(--color-border) pt-3">
          {paymentType === "PARTIALLY_PAID" ? (
            <Field id="initial-paid" label="Paid amount" required>
              <Input
                value={paidAmountStr}
                onChange={(e) => onPaidAmountStrChange(e.target.value)}
                inputMode="decimal"
                disabled={disabled}
              />
            </Field>
          ) : null}
          <Field id="pay-method" label="Payment method" required>
            <Select
              searchable={false}
              value={paymentMethod}
              onChange={(e) => onPaymentMethodChange(e.target.value as PurchasePaymentMethod)}
              disabled={disabled}
            >
              {PAYMENT_METHOD_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
          {showBankFields ? (
            <Field
              id="pay-bank-account"
              label="Bank account"
              required
              hint="Records a withdrawal in bank transactions for this payment"
            >
              {bankAccounts.length === 0 ? (
                <p className="text-sm text-muted">
                  No active bank accounts.{" "}
                  <Link
                    href="/banks"
                    className="font-medium text-[var(--color-primary)] hover:underline"
                  >
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
          ) : null}
          <Field id="pay-remarks" label="Remarks">
            <Input
              value={remarks}
              onChange={(e) => onRemarksChange(e.target.value)}
              disabled={disabled}
            />
          </Field>
          {showBankFields && bankAccountId ? bankProofSlot : null}
        </div>
      ) : null}

      {paymentType === "PARTIALLY_PAID" && paidResult.invalid ? (
        <p className="flex items-center gap-1.5 text-sm text-danger">
          <AlertCircle size={14} aria-hidden />
          Enter a valid payment amount
        </p>
      ) : null}
    </div>
  );
}

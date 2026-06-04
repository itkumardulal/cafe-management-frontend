"use client";

import { useMemo } from "react";
import { DatePicker } from "@/src/components/ui/date-picker";
import { Field } from "@/src/components/ui/field";
import { Select } from "@/src/components/ui/select";
import { PAYMENT_TERMS_OPTIONS } from "@/src/lib/ap-display";
import type { PaymentTermsPreset } from "@/src/lib/ap-types";

function addDays(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const TERM_DAYS: Record<string, number> = {
  IMMEDIATE: 0,
  NET_7: 7,
  NET_15: 15,
  NET_30: 30,
  NET_45: 45,
};

type Props = {
  purchaseDate: string;
  preset: PaymentTermsPreset;
  onPresetChange: (v: PaymentTermsPreset) => void;
  customDueDate: string;
  onCustomDueDateChange: (v: string) => void;
  disabled?: boolean;
};

export function PaymentTermsSection({
  purchaseDate,
  preset,
  onPresetChange,
  customDueDate,
  onCustomDueDateChange,
  disabled,
}: Props) {
  const computedDue = useMemo(() => {
    if (!purchaseDate) {
      return "";
    }
    if (preset === "CUSTOM") {
      return customDueDate;
    }
    return addDays(purchaseDate, TERM_DAYS[preset] ?? 0);
  }, [purchaseDate, preset, customDueDate]);

  return (
    <div className="space-y-3 rounded-lg border border-(--color-border) bg-surface-muted/50 p-4">
      <p className="text-sm font-medium text-foreground">Payment terms</p>
      <Field id="payment-terms" label="Terms">
        <Select
          searchable={false}
          value={preset}
          onChange={(e) => onPresetChange(e.target.value as PaymentTermsPreset)}
          disabled={disabled}
        >
          {PAYMENT_TERMS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </Field>
      {preset === "CUSTOM" ? (
        <Field id="custom-due" label="Due date" required>
          <DatePicker
            value={customDueDate}
            onChange={onCustomDueDateChange}
            disabled={disabled}
          />
        </Field>
      ) : (
        <p className="text-sm text-muted">
          Due date: <span className="font-medium text-foreground">{computedDue || "—"}</span>
        </p>
      )}
    </div>
  );
}

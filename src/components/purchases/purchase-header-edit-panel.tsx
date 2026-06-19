"use client";

import { useEffect, useMemo, useState } from "react";
import { PaymentTermsSection } from "@/src/components/purchases/payment-terms-section";
import { Button } from "@/src/components/ui/button";
import { Field } from "@/src/components/ui/field";
import type { ApBillSummary, PaymentTermsPreset } from "@/src/lib/ap-types";
import { hasEditChanges } from "@/src/lib/form-snapshot";

export type PurchaseHeaderEditPayload = {
  notes?: string;
  paymentTermsPreset: PaymentTermsPreset;
  dueDate?: string;
};

type Props = {
  purchase: Pick<
    ApBillSummary,
    "purchaseDate" | "notes" | "dueDate" | "paymentTermsPreset"
  >;
  saving: boolean;
  onSave: (payload: PurchaseHeaderEditPayload) => void | Promise<void>;
  onCancel: () => void;
};

export function PurchaseHeaderEditPanel({ purchase, saving, onSave, onCancel }: Props) {
  const [notes, setNotes] = useState(purchase.notes ?? "");
  const [preset, setPreset] = useState<PaymentTermsPreset>(
    purchase.paymentTermsPreset ?? "IMMEDIATE",
  );
  const [customDueDate, setCustomDueDate] = useState(
    purchase.dueDate?.slice(0, 10) ?? purchase.purchaseDate.slice(0, 10),
  );
  const [initialDraft, setInitialDraft] = useState<{
    notes: string;
    preset: PaymentTermsPreset;
    customDueDate: string;
  } | null>(null);

  useEffect(() => {
    const nextNotes = purchase.notes ?? "";
    const nextPreset = purchase.paymentTermsPreset ?? "IMMEDIATE";
    const nextDueDate = purchase.dueDate?.slice(0, 10) ?? purchase.purchaseDate.slice(0, 10);
    setNotes(nextNotes);
    setPreset(nextPreset);
    setCustomDueDate(nextDueDate);
    setInitialDraft({ notes: nextNotes, preset: nextPreset, customDueDate: nextDueDate });
  }, [purchase]);

  const draft = useMemo(
    () => ({ notes, preset, customDueDate }),
    [notes, preset, customDueDate],
  );
  const canSave = hasEditChanges(true, draft, initialDraft);

  return (
    <div className="space-y-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)]/40 p-4">
      <p className="text-sm font-medium text-[var(--color-foreground)]">Edit purchase details</p>
      <Field id="edit-notes" label="Notes" hint="Optional internal notes">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full resize-y rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-primary)]"
          placeholder="Notes about this purchase…"
        />
      </Field>
      <PaymentTermsSection
        purchaseDate={purchase.purchaseDate.slice(0, 10)}
        preset={preset}
        onPresetChange={setPreset}
        customDueDate={customDueDate}
        onCustomDueDateChange={setCustomDueDate}
      />
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button
          type="button"
          loading={saving}
          disabled={!canSave}
          onClick={() =>
            void onSave({
              notes: notes.trim() || undefined,
              paymentTermsPreset: preset,
              ...(preset === "CUSTOM" ? { dueDate: customDueDate } : {}),
            })
          }
        >
          Save changes
        </Button>
      </div>
    </div>
  );
}

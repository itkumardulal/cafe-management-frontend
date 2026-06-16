"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Field } from "@/src/components/ui/field";
import { Input } from "@/src/components/ui/input";
import { NumberInput } from "@/src/components/ui/number-input";
import { Select } from "@/src/components/ui/select";
import { cn } from "@/src/lib/cn";
import type { RawMaterialOption, RecipeLineFormRow } from "@/src/lib/recipe-types";
import { emptyRecipeLine } from "@/src/lib/recipe-types";

type RecipeLinesEditorProps = {
  lines: RecipeLineFormRow[];
  onChange: (lines: RecipeLineFormRow[]) => void;
  options: RawMaterialOption[];
  disabled?: boolean;
};

export function RecipeLinesEditor({
  lines,
  onChange,
  options,
  disabled = false,
}: RecipeLinesEditorProps) {
  const updateLine = (index: number, patch: Partial<RecipeLineFormRow>) => {
    onChange(lines.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  };

  const removeLine = (index: number) => {
    if (lines.length <= 1) {
      onChange([emptyRecipeLine()]);
      return;
    }
    onChange(lines.filter((_, i) => i !== index));
  };

  const addLine = () => {
    onChange([...lines, emptyRecipeLine()]);
  };

  const materialUnit = (id: string) => options.find((o) => o.id === id)?.unit;

  const selectMaterial = (index: number, rawMaterialItemId: string) => {
    const catalogUnit = materialUnit(rawMaterialItemId);
    const line = lines[index];
    updateLine(index, {
      rawMaterialItemId,
      unit: line.unit.trim() || catalogUnit || "",
    });
  };

  return (
    <div className="space-y-3">
      {lines.map((line, idx) => (
        <article
          key={idx}
          className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]"
        >
          <header className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)]/12 text-sm font-semibold text-[var(--color-primary)]"
                aria-hidden
              >
                {idx + 1}
              </span>
              <p className="text-sm font-medium text-[var(--color-foreground)]">
                Ingredient {idx + 1}
              </p>
            </div>
            <button
              type="button"
              onClick={() => removeLine(idx)}
              disabled={disabled}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-danger)] transition-colors hover:border-[var(--color-danger)]/30 hover:bg-[var(--color-danger)]/8 disabled:opacity-50"
              aria-label={`Remove ingredient ${idx + 1}`}
            >
              <Trash2 size={16} aria-hidden />
            </button>
          </header>

          <div className="form-line-fields p-4">
            <Field
              id={`recipe-material-${idx}`}
              label="Ingredient"
              required
              reserveErrorSpace={false}
            >
              <Select
                searchable
                value={line.rawMaterialItemId}
                onChange={(e) => selectMaterial(idx, e.target.value)}
                disabled={disabled}
              >
                <option value="">Choose ingredient</option>
                {options.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                    {m.unit ? ` (${m.unit})` : ""}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="form-grid">
              <Field id={`recipe-qty-${idx}`} label="Quantity" required reserveErrorSpace={false}>
                <NumberInput
                  min={0}
                  value={line.quantity}
                  onValueChange={(quantity) => updateLine(idx, { quantity })}
                  placeholder="e.g. 200"
                  disabled={disabled}
                />
              </Field>
              <Field id={`recipe-unit-${idx}`} label="Unit" reserveErrorSpace={false}>
                <Input
                  value={line.unit}
                  onChange={(e) => updateLine(idx, { unit: e.target.value })}
                  placeholder="e.g. g, kg, ml"
                  disabled={disabled}
                />
              </Field>
            </div>
            <Field id={`recipe-note-${idx}`} label="Note" reserveErrorSpace={false}>
              <Input
                value={line.notes}
                onChange={(e) => updateLine(idx, { notes: e.target.value })}
                placeholder="e.g. finely chopped"
                disabled={disabled}
              />
            </Field>
          </div>
        </article>
      ))}

      <Button
        type="button"
        variant="secondary"
        onClick={addLine}
        disabled={disabled}
        className={cn("w-full sm:w-auto")}
      >
        Add ingredient
      </Button>
    </div>
  );
}

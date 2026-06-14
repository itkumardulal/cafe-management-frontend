"use client";

import { Landmark } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Select } from "@/src/components/ui/select";
import { ReportFilterSectionLabel } from "@/src/features/reports/components/report-filters-toolbar";
import { cn } from "@/src/lib/cn";

export const ALL_BANKS_FILTER = "all";

type BankFilterOption = {
  id: string;
  label: string;
};

type ReportBankAccountFilterProps = {
  id?: string;
  value: string;
  onChange: (bankAccountId: string | undefined) => void;
  banks: BankFilterOption[];
  disabled?: boolean;
  className?: string;
};

export function ReportBankAccountFilter({
  id = "bankAccountFilter",
  value,
  onChange,
  banks,
  disabled = false,
  className,
}: ReportBankAccountFilterProps) {
  const selectedBank = banks.find((bank) => bank.id === value);
  const isFiltered = value !== ALL_BANKS_FILTER;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-2">
        <ReportFilterSectionLabel icon={Landmark} htmlFor={id}>
          Bank account
        </ReportFilterSectionLabel>
        {isFiltered ? (
          <Badge size="sm" variant="default">
            Filtered
          </Badge>
        ) : null}
      </div>

      <Select
        id={id}
        value={value}
        disabled={disabled || banks.length === 0}
        onChange={(event) => {
          const next = event.target.value;
          onChange(next === ALL_BANKS_FILTER ? undefined : next);
        }}
        className="h-9 min-h-9 rounded-lg border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm shadow-sm"
      >
        <option value={ALL_BANKS_FILTER}>All banks</option>
        {banks.map((bank) => (
          <option key={bank.id} value={bank.id}>
            {bank.label}
          </option>
        ))}
      </Select>

      {isFiltered && selectedBank ? (
        <p className="text-xs leading-relaxed text-[var(--color-muted)]">
          Viewing <span className="font-medium text-foreground">{selectedBank.label}</span>. Choose
          All banks for combined totals.
        </p>
      ) : (
        <p className="text-xs leading-relaxed text-[var(--color-muted)]">
          Combined balances and transactions across every account.
        </p>
      )}
    </div>
  );
}

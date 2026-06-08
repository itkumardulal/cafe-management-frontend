import { type InputHTMLAttributes, forwardRef } from "react";
import { normalizeNumericStr } from "@/src/lib/money-input";
import { Input } from "@/src/components/ui/input";

type NumberInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "onChange" | "inputMode"
> & {
  value: string;
  onValueChange: (value: string) => void;
  decimals?: number;
  allowNegative?: boolean;
  hasError?: boolean;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
};

function stepForDecimals(decimals: number) {
  if (decimals === 0) return 1;
  return Number(`0.${"0".repeat(Math.max(0, decimals - 1))}1`);
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      value,
      onValueChange,
      decimals = 2,
      allowNegative = false,
      onBlur,
      onWheel,
      min,
      step,
      ...props
    },
    ref,
  ) => {
    return (
      <Input
        ref={ref}
        type="number"
        inputMode={decimals === 0 ? "numeric" : "decimal"}
        step={step ?? stepForDecimals(decimals)}
        min={min}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        onBlur={(e) => {
          const normalized = normalizeNumericStr(e.target.value, { decimals, allowNegative });
          if (normalized !== e.target.value) {
            onValueChange(normalized);
          }
          onBlur?.(e);
        }}
        onWheel={(e) => {
          e.currentTarget.blur();
          onWheel?.(e);
        }}
        {...props}
      />
    );
  },
);

NumberInput.displayName = "NumberInput";

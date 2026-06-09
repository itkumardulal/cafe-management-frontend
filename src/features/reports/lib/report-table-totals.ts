import { roundMoneyStr } from "@/src/lib/money-input";

export function sumDecimalStrings(values: string[]): string {
  const total = values.reduce((acc, value) => acc + Number(value), 0);
  return roundMoneyStr(total);
}

export function sumNumbers(values: number[]): number {
  return values.reduce((acc, value) => acc + value, 0);
}

export function averageDecimalStrings(values: string[]): string {
  if (values.length === 0) {
    return "0.00";
  }
  const total = values.reduce((acc, value) => acc + Number(value), 0);
  return roundMoneyStr(total / values.length);
}

export function parseNumericString(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function sumField<T, K extends keyof T>(items: T[], field: K): string {
  const total = items.reduce((acc, item) => acc + Number(item[field]), 0);
  return roundMoneyStr(total);
}

export function sumQuantityFromField<T, K extends keyof T>(items: T[], field: K): number {
  return items.reduce((acc, item) => acc + Number(item[field]), 0);
}

import type { SaleBillStatus, SalePaymentMethod, SalePaymentStatus } from "@/src/lib/ar-types";

export function salePaymentStatusLabel(status: SalePaymentStatus): string {
  switch (status) {
    case "PAID":
      return "Paid";
    case "PARTIAL":
      return "Partial";
    case "UNPAID":
      return "Unpaid";
  }
}

export function salePaymentStatusVariant(
  status: SalePaymentStatus,
): "success" | "warning" | "danger" | "default" {
  switch (status) {
    case "PAID":
      return "success";
    case "PARTIAL":
      return "warning";
    case "UNPAID":
      return "danger";
  }
}

export function saleBillStatusLabel(status: SaleBillStatus): string {
  switch (status) {
    case "OPEN":
      return "Open";
    case "OVERDUE":
      return "Overdue";
    case "CLOSED":
      return "Closed";
  }
}

export function saleBillStatusVariant(
  status: SaleBillStatus,
): "success" | "warning" | "danger" | "default" {
  switch (status) {
    case "CLOSED":
      return "success";
    case "OVERDUE":
      return "danger";
    case "OPEN":
      return "default";
  }
}

export const SALE_PAYMENT_METHOD_OPTIONS = [
  { value: "CASH" as const, label: "Cash" },
  { value: "BANK_TRANSFER" as const, label: "Bank transfer" },
  { value: "CHEQUE" as const, label: "Cheque" },
] as const;

export function formatSalePaymentMethod(method: string): string {
  const found = SALE_PAYMENT_METHOD_OPTIONS.find((o) => o.value === method);
  return found?.label ?? method.replace(/_/g, " ");
}

export const SALE_PAYMENT_TERMS_OPTIONS = [
  { value: "IMMEDIATE" as const, label: "Immediate" },
  { value: "NET_7" as const, label: "7 days" },
  { value: "NET_15" as const, label: "15 days" },
  { value: "NET_30" as const, label: "30 days" },
  { value: "NET_45" as const, label: "45 days" },
  { value: "CUSTOM" as const, label: "Custom due date" },
] as const;

import type { PurchasePaymentStatus, SupplierBillStatus } from "@/src/lib/ap-types";

export function paymentStatusLabel(status: PurchasePaymentStatus): string {
  switch (status) {
    case "PAID":
      return "Paid";
    case "PARTIAL":
      return "Partial";
    case "UNPAID":
      return "Unpaid";
  }
}

export function paymentStatusVariant(
  status: PurchasePaymentStatus,
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

export function billStatusLabel(status: SupplierBillStatus): string {
  switch (status) {
    case "OPEN":
      return "Open";
    case "OVERDUE":
      return "Overdue";
    case "CLOSED":
      return "Closed";
  }
}

export function billStatusVariant(
  status: SupplierBillStatus,
): "default" | "success" | "danger" {
  switch (status) {
    case "OPEN":
      return "default";
    case "OVERDUE":
      return "danger";
    case "CLOSED":
      return "success";
  }
}

export const PAYMENT_METHOD_OPTIONS = [
  { value: "CASH", label: "Cash" },
  { value: "BANK_TRANSFER", label: "Bank transfer" },
  { value: "ESEWA", label: "eSewa" },
  { value: "KHALTI", label: "Khalti" },
  { value: "CHEQUE", label: "Cheque" },
] as const;

export function formatPaymentMethod(method: string): string {
  const found = PAYMENT_METHOD_OPTIONS.find((o) => o.value === method);
  return found?.label ?? method.replace(/_/g, " ");
}

export const PAYMENT_TERMS_OPTIONS = [
  { value: "IMMEDIATE", label: "Immediate" },
  { value: "NET_7", label: "7 days" },
  { value: "NET_15", label: "15 days" },
  { value: "NET_30", label: "30 days" },
  { value: "NET_45", label: "45 days" },
  { value: "CUSTOM", label: "Custom due date" },
] as const;

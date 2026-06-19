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

const LEGACY_SALE_PAYMENT_METHOD_LABELS: Record<string, string> = {
  ESEWA: "eSewa",
  KHALTI: "Khalti",
};

export const RECEIVABLE_PAYMENT_METHOD_OPTIONS = SALE_PAYMENT_METHOD_OPTIONS.filter(
  (o) => o.value !== "CHEQUE",
);

export function formatSalePaymentMethod(method: string): string {
  const found = SALE_PAYMENT_METHOD_OPTIONS.find((o) => o.value === method);
  return found?.label ?? LEGACY_SALE_PAYMENT_METHOD_LABELS[method] ?? method.replace(/_/g, " ");
}

export function salePaymentBankName(payment: {
  paymentMethod: string;
  bankAccountLabel?: string | null;
  chequeBankName?: string | null;
}): string | null {
  if (payment.bankAccountLabel?.trim()) {
    const bankName = payment.bankAccountLabel.split(" · ")[0]?.trim();
    if (bankName) return bankName;
  }
  if (payment.paymentMethod === "CHEQUE" && payment.chequeBankName?.trim()) {
    return payment.chequeBankName.trim();
  }
  return null;
}

export function formatSalePaymentMethodDetail(payment: {
  paymentMethod: string;
  bankAccountLabel?: string | null;
  chequeBankName?: string | null;
  referenceNumber?: string | null;
}): string {
  if (payment.paymentMethod === "BANK_TRANSFER") {
    const bankName = salePaymentBankName(payment);
    return bankName ? `BankTransfer(${bankName})` : "BankTransfer";
  }

  let label = formatSalePaymentMethod(payment.paymentMethod);
  if (payment.paymentMethod === "CHEQUE" && payment.chequeBankName?.trim()) {
    label += ` · ${payment.chequeBankName.trim()}`;
  }
  if (payment.referenceNumber?.trim()) {
    label += ` #${payment.referenceNumber.trim()}`;
  }
  return label;
}

export const SALE_PAYMENT_TERMS_OPTIONS = [
  { value: "IMMEDIATE" as const, label: "Immediate" },
  { value: "NET_7" as const, label: "7 days" },
  { value: "NET_15" as const, label: "15 days" },
  { value: "NET_30" as const, label: "30 days" },
  { value: "NET_45" as const, label: "45 days" },
  { value: "CUSTOM" as const, label: "Custom due date" },
] as const;

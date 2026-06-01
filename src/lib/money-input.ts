export function parseMoneyInput(str: string) {
  const t = str.trim();
  if (t === "") return { amount: 0, invalid: false };
  const n = Number(t);
  if (!Number.isFinite(n) || n < 0) return { amount: 0, invalid: true };
  return { amount: Math.round(n * 100) / 100, invalid: false };
}

export function roundMoneyStr(n: number) {
  return String(Math.round(Math.max(0, n) * 100) / 100);
}

export type PurchaseBillingType = "PAID" | "CREDIT";

export type PurchasePaymentSummary = {
  billingType: PurchaseBillingType;
  grandTotal: string;
  cashPaidAmount: string;
  bankPaidAmount: string;
  creditAmount: string;
};

export type PurchasePaymentStatus = "paid" | "credit" | "partial" | "not_recorded";

export function getPurchasePaymentStatus(payment: PurchasePaymentSummary): PurchasePaymentStatus {
  const grand = Number(payment.grandTotal);
  const cash = Number(payment.cashPaidAmount);
  const bank = Number(payment.bankPaidAmount);
  const credit = Number(payment.creditAmount);
  const paidSum = cash + bank + credit;

  if (grand > 0.005 && paidSum < 0.005) {
    return "not_recorded";
  }

  if (payment.billingType === "CREDIT" && credit > 0.005 && cash + bank > 0.005) {
    return "partial";
  }

  if (payment.billingType === "CREDIT" && credit > 0.005) {
    return "credit";
  }

  return "paid";
}

export function purchasePaymentStatusLabel(status: PurchasePaymentStatus): string {
  switch (status) {
    case "paid":
      return "Paid";
    case "credit":
      return "Credit";
    case "partial":
      return "Partial";
    case "not_recorded":
      return "Not recorded";
  }
}

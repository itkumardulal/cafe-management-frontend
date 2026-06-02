export type CheckoutPaymentType = "FULLY_PAID" | "PARTIALLY_PAID" | "CREDIT";

export type SalePaymentStatus = "PAID" | "PARTIAL" | "UNPAID";

export type SaleBillStatus = "OPEN" | "OVERDUE" | "CLOSED";

export type SalePaymentMethod = "CASH" | "BANK_TRANSFER" | "CHEQUE";

export type PaymentTermsPreset =
  | "IMMEDIATE"
  | "NET_7"
  | "NET_15"
  | "NET_30"
  | "NET_45"
  | "CUSTOM";

export type SalePaymentRow = {
  id: string;
  receiptNo: string;
  amount: string;
  paymentMethod: SalePaymentMethod;
  referenceNumber?: string | null;
  chequeBankName?: string | null;
  remarks?: string | null;
  proofAttachmentUrl?: string | null;
  paymentDate: string;
  createdAt: string;
  createdByName?: string | null;
};

export type InitialSalePaymentInput = {
  amount: number;
  paymentMethod: SalePaymentMethod;
  referenceNumber?: string;
  chequeBankName?: string;
  remarks?: string;
  proofAttachmentUrl?: string;
};

export type SaleDetailResponse = {
  id: string;
  receiptNo: string;
  saleAt: string;
  createdAt: string;
  serviceType: "DINE_IN" | "DELIVERY";
  billingType: "PAID" | "CREDIT";
  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  customerAddress?: string | null;
  tableId?: string | null;
  tableName?: string | null;
  subtotal: string;
  otherChargeAmount: string;
  discountAmount: string;
  discountPercent?: string | null;
  grandTotal: string;
  cashPaidAmount: string;
  bankPaidAmount: string;
  creditAmount: string;
  paidAmount: string;
  remainingAmount: string;
  paymentStatus: SalePaymentStatus;
  billStatus: SaleBillStatus;
  dueDate?: string | null;
  paymentTermsPreset?: PaymentTermsPreset | null;
  lastPaymentDate?: string | null;
  notes?: string | null;
  createdByName?: string | null;
  lineCount: number;
  cafe?: {
    cafeName: string;
    address?: string | null;
    contactNumber?: string | null;
    email?: string;
  };
  payments: SalePaymentRow[];
  lines: Array<{
    id: string;
    menuItemId: string;
    menuItemName: string;
    quantity: string;
    unitPrice: string;
    lineTotal: string;
  }>;
};

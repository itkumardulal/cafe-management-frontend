export type CheckoutPaymentType = "FULLY_PAID" | "PARTIALLY_PAID" | "CREDIT";

export type SalePaymentStatus = "PAID" | "PARTIAL" | "UNPAID";

export type SaleBillStatus = "OPEN" | "OVERDUE" | "CLOSED";

export type SalePaymentMethod = "CASH" | "BANK_TRANSFER" | "CHEQUE";

export type CustomerType = "WALK_IN" | "REGISTERED";

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
  bankAccountId?: string | null;
  bankAccountLabel?: string | null;
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
  bankAccountId?: string;
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
  customerId?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  customerAddress?: string | null;
  tableId?: string | null;
  tableName?: string | null;
  tableNamesSnapshot?: string | null;
  subtotal: string;
  otherChargeAmount: string;
  discountAmount: string;
  discountPercent?: string | null;
  grandTotal: string;
  cashPaidAmount: string;
  bankPaidAmount: string;
  creditAmount: string;
  paidAmount: string;
  changeAmount: string;
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
    logo?: string | null;
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
    costPerUnitAtSale: string;
  }>;
};

export type CustomerReceivableListRow = {
  id: string;
  name: string;
  phoneNumber: string;
  address?: string | null;
  outstandingAmount: string;
  totalPurchases: string;
  totalPaid: string;
  creditBillsCount: number;
  lastVisitAt: string | null;
};

export type CustomerReceivableDetail = {
  customer: {
    id: string;
    name: string;
    phoneNumber: string;
    email?: string | null;
    address?: string | null;
    notes?: string | null;
    outstandingAmount: string;
    totalPurchases: string;
    totalPaid: string;
    creditBillsCount: number;
    lastVisitAt: string | null;
  };
  purchaseHistory: Array<{
    id: string;
    receiptNo: string;
    saleAt: string;
    grandTotal: string;
    paidAmount: string;
    remainingAmount: string;
    paymentStatus: SalePaymentStatus;
    billStatus: SaleBillStatus;
    lines: Array<{ name: string; quantity: string; lineTotal: string }>;
  }>;
  paymentHistory: Array<{
    id: string;
    kind: "CRP" | "SPAY";
    saleId?: string;
    receiptNo: string;
    amount: string;
    amountReceived?: string;
    changeAmount?: string;
    remainingOutstanding?: string;
    paymentMethod: string;
    bankAccountLabel?: string | null;
    remarks: string | null;
    paidAt: string;
    createdByName: string | null;
    allocations?: Array<{ receiptNo: string; amount: string }>;
  }>;
};

export type CustomerReceivablePaymentReceiptData = {
  receiptNo: string;
  amount: string;
  amountReceived?: string;
  changeAmount?: string;
  remainingOutstanding?: string;
  paymentMethod: string;
  remarks: string | null;
  paidAt: string;
  createdByName: string | null;
  bankAccountLabel?: string | null;
  customer: {
    name: string;
    phoneNumber: string;
    address?: string | null;
    email?: string | null;
  };
  allocations: Array<{ receiptNo: string; amount: string }>;
  cafe?: {
    cafeName: string;
    logo?: string | null;
    address?: string | null;
    contactNumber?: string | null;
    email?: string;
  };
};

export type CustomerReceivablePaymentPrintResponse =
  | { printType: "sale"; sale: SaleDetailResponse }
  | { printType: "payment"; payment: CustomerReceivablePaymentReceiptData };

export type CustomerSearchHit = {
  id: string;
  name: string;
  phoneNumber: string;
  outstandingAmount: string;
};

export type FifoAllocationPreview = {
  customerId: string;
  amountReceived: string;
  appliedAmount: string;
  changeAmount: string;
  paymentAmount: string;
  totalOutstanding: string;
  remainingOutstanding: string;
  allocations: Array<{ saleId: string; receiptNo: string; amount: string }>;
};

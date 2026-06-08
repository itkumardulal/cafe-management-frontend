export type PurchasePaymentStatus = "PAID" | "PARTIAL" | "UNPAID";
export type SupplierBillStatus = "OPEN" | "OVERDUE" | "CLOSED";
export type PurchasePaymentMethod =
  | "CASH"
  | "BANK_TRANSFER"
  | "ESEWA"
  | "KHALTI"
  | "CHEQUE";
export type PaymentTermsPreset =
  | "IMMEDIATE"
  | "NET_7"
  | "NET_15"
  | "NET_30"
  | "NET_45"
  | "CUSTOM";
export type CreatePaymentType = "FULLY_PAID" | "PARTIALLY_PAID" | "CREDIT";

export type SupplierBillKind = "RAW_MATERIAL" | "DIRECT";

export type ApBillSummary = {
  id: string;
  receiptNo: string;
  purchaseDate: string;
  createdAt: string;
  notes?: string | null;
  lineCount: number;
  totalAmount: string;
  grandTotal: string;
  paidAmount: string;
  remainingAmount: string;
  paymentStatus: PurchasePaymentStatus;
  billStatus: SupplierBillStatus;
  dueDate?: string | null;
  paymentTermsDays?: number | null;
  paymentTermsPreset?: PaymentTermsPreset | null;
  lastPaymentDate?: string | null;
  supplierInvoiceNo?: string | null;
  supplierId?: string | null;
  supplierName?: string | null;
  supplierPhone?: string | null;
  supplierAddress?: string | null;
  purchaseGroupId?: string | null;
  billingType?: "PAID" | "CREDIT";
  cashPaidAmount?: string;
  bankPaidAmount?: string;
  creditAmount?: string;
  bankPaymentScreenshotUrl?: string | null;
};

export type PurchasePaymentRow = {
  id: string;
  receiptNo: string;
  amount: string;
  paymentMethod: PurchasePaymentMethod;
  referenceNumber?: string | null;
  remarks?: string | null;
  proofAttachmentUrl?: string | null;
  paymentDate: string;
  createdAt: string;
  createdByName?: string | null;
  settlementBatchId?: string | null;
  settlementReceiptNo?: string | null;
};

export type ApBillDetail = ApBillSummary & {
  createdByName?: string | null;
  cafe?: {
    cafeName: string;
    address?: string | null;
    contactNumber?: string | null;
    email?: string;
  };
  lines: Array<{
    id: string;
    rawMaterialItem: { id: string; name: string; unit: string };
    supplier: { id: string; name: string };
    quantity: string;
    ratePerUnit: string;
    lineTotal: string;
  }>;
  payments: PurchasePaymentRow[];
};

export type DirectApBillDetail = ApBillSummary & {
  createdByName?: string | null;
  cafe?: {
    cafeName: string;
    address?: string | null;
    contactNumber?: string | null;
    email?: string;
  };
  lines: Array<{
    id: string;
    directPurchaseItemId: string;
    item: { id: string; name: string; unitType: string | null; unitQuantity: string | null };
    supplier: { id: string; name: string };
    quantity: string;
    ratePerUnit: string;
    lineTotal: string;
  }>;
  payments: PurchasePaymentRow[];
};

export type BillSettlementSupplierRow = {
  id: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  outstandingAmount: string;
  totalPurchases: string;
  totalPaid: string;
  openBillsCount: number;
  billsCount: number;
  lastPurchaseAt: string | null;
};

export type BillSettlementSupplierDetail = {
  supplier: {
    id: string;
    name: string;
    phone?: string | null;
    contactPerson?: string | null;
    email?: string | null;
    address?: string | null;
    notes?: string | null;
    totalPurchases: string;
    totalPaid: string;
    outstandingAmount: string;
    openBillsCount: number;
    lastPurchaseAt: string | null;
  };
  purchaseHistory: Array<{
    id: string;
    billKind?: SupplierBillKind;
    receiptNo: string;
    purchaseDate: string;
    dueDate: string | null;
    grandTotal: string;
    paidAmount: string;
    remainingAmount: string;
    paymentStatus: PurchasePaymentStatus;
    billStatus: SupplierBillStatus;
    lines: Array<{
      id: string;
      name: string;
      unit: string;
      quantity: string;
      lineTotal: string;
    }>;
  }>;
  paymentHistory: Array<
    PurchasePaymentRow & {
      billKind?: SupplierBillKind;
      purchaseId: string;
      purchaseReceiptNo: string;
    }
  >;
};

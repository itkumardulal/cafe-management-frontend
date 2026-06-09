export type ReportPeriodKey = "today" | "this_week" | "this_month" | "custom";

export type ReportPeriodParams = {
  period?: ReportPeriodKey;
  fromDate?: string;
  toDate?: string;
};

export type ReportPeriod = {
  key: ReportPeriodKey;
  from: string;
  to: string;
  label: string;
};

export type ReportsSummary = {
  period: ReportPeriod;
  generatedAt: string;
  periodMetrics: {
    totalSales: string;
    totalProfit: string;
    totalExpenses: string;
  };
  snapshotMetrics: {
    outstandingCustomerReceivables: string;
    outstandingSupplierPayables: string;
    stockAlerts: number;
    stockAlertsLow: number;
    stockAlertsOut: number;
  };
};

export type SalesReport = {
  period: ReportPeriod;
  totalSales: string;
  totalOrders: number;
  averageOrderValue: string;
  totalDiscountGiven: string;
  topMenuItems: Array<{
    menuItemId: string;
    name: string;
    quantitySold: string;
    revenue: string;
  }>;
};

export type ProfitReport = {
  period: ReportPeriod;
  grossSalesBeforeDiscount: string;
  totalDiscountGiven: string;
  revenue: string;
  costOfGoodsSold: string;
  grossProfit: string;
  profitMarginPercent: string;
  costPriceNote: string;
  topProfitableItems: Array<{
    menuItemId: string;
    name: string;
    quantitySold: string;
    revenue: string;
    cost: string;
    profit: string;
    marginPercent: string;
  }>;
};

export type DiscountReport = {
  period: ReportPeriod;
  summary: {
    totalDiscountAmount: string;
    discountTransactionCount: number;
    discountAsPercentOfSales: string;
    periodSales: string;
  };
  summaryByStaff: Array<{
    staffId: string | null;
    staffName: string;
    transactionCount: number;
    totalDiscountAmount: string;
  }>;
  items: Array<{
    id: string;
    receiptNo: string;
    saleAt: string;
    subtotal: string;
    discountAmount: string;
    discountPercent: string | null;
    grandTotal: string;
    staff: { id: string; fullName: string } | null;
  }>;
  meta: { page: number; limit: number; total: number; totalPages: number };
};

export type ExpenseReport = {
  period: ReportPeriod;
  totalExpenses: string;
  byCategory: Array<{
    category: string;
    label: string;
    amount: string;
    percentOfTotal: string;
  }>;
  comparison: {
    periodSales: string;
    periodGrossProfit: string;
    expenseAsPercentOfSales: string;
    netAfterExpenses: string;
  };
};

export type InventoryReport = {
  period: ReportPeriod;
  snapshot: {
    currentStock: Array<{
      id: string;
      kind: "MENU" | "INVENTORY";
      name: string;
      quantityOnHand: string;
      reorderLevel: string | null;
      unit: string | null;
    }>;
    alerts: {
      low: Array<{ id: string; kind: string; name: string; quantityOnHand: string; reorderLevel: string; unit: string | null }>;
      out: Array<{ id: string; kind: string; name: string; quantityOnHand: string; reorderLevel: string; unit: string | null }>;
      counts: { low: number; out: number };
    };
    itemsTracked: number;
  };
  periodActivity: {
    items: Array<{
      itemKind: "MENU" | "INVENTORY";
      itemId: string;
      itemName: string;
      unit: string | null;
      purchasedOrAdded: string;
      consumed: string;
      netChange: string;
      remaining: string;
    }>;
    movementSummary: Record<string, number>;
    rawMaterialPurchases: Array<{
      rawMaterialItemId: string;
      name: string;
      unit: string | null;
      totalPurchasedQty: string;
      totalPurchaseValue: string;
      note: string;
    }>;
    directPurchases: Array<{
      directPurchaseItemId: string;
      name: string;
      unitType: string | null;
      unitQuantity: string | null;
      totalPurchasedQty: string;
      totalPurchaseValue: string;
      note: string;
    }>;
    meta: { page: number; limit: number; total: number; totalPages: number };
  };
};

export type CustomerReceivableReport = {
  snapshotNote: string;
  generatedAt: string;
  summary: {
    totalOutstanding: string;
    overdueAmount: string;
    customersWithCredit: number;
  };
  aging: {
    current: number;
    days1_30: number;
    days31_60: number;
    days61_90: number;
    days90Plus: number;
    totalOutstanding: number;
  };
  items: Array<{
    customerId: string;
    name: string;
    phoneNumber: string;
    outstandingAmount: string;
    unpaidBillCount: number;
    overdueAmount: string;
    lastPaymentDate: string | null;
    oldestDueDate: string | null;
  }>;
  meta: { page: number; limit: number; total: number; totalPages: number };
};

export type SupplierPayableReport = {
  period: ReportPeriod;
  snapshotNote: string;
  summary: {
    outstandingBillsAmount: string;
    overdueBillsAmount: string;
    billsDueThisWeekAmount: string;
    suppliersWithOutstandingCount: number;
  };
  outstandingSuppliers: Array<{
    supplierId: string;
    supplierName: string;
    totalPurchases: number;
    totalAmount: string;
    paidAmount: string;
    outstandingAmount: string;
  }>;
  aging: {
    items: Array<{
      supplierId: string;
      supplierName: string;
      current: number;
      days1_30: number;
      days31_60: number;
      days61_90: number;
      days90Plus: number;
      totalOutstanding: number;
    }>;
    totals: Record<string, number>;
  };
  outstandingBills: {
    items: Array<{
      id: string;
      receiptNo: string;
      supplierName: string;
      dueDate: string | null;
      remainingAmount: string;
      grandTotal: string;
      paidAmount: string;
      billStatus: string;
      isOverdue: boolean;
    }>;
    meta: { page: number; limit: number; total: number; totalPages: number };
  };
  paymentHistory: Array<{
    id: string;
    receiptNo: string;
    purchaseReceiptNo: string;
    supplierName: string;
    amount: string;
    paymentMethod: string;
    paymentDate: string;
  }>;
};

export type BankReport = {
  period: ReportPeriod;
  snapshotNote: string;
  summary: {
    totalCurrentBalance: string;
    activeAccountCount: number;
    totalDepositsInPeriod: string;
    totalWithdrawalsInPeriod: string;
    netChangeInPeriod: string;
  };
  accounts: Array<{
    id: string;
    bankName: string;
    accountNumber: string;
    accountHolderName: string;
    isActive: boolean;
    openingBalance: string;
    currentBalance: string;
    balanceAtPeriodStart: string;
    balanceAtPeriodEnd: string;
    periodDeposits: string;
    periodWithdrawals: string;
    periodNetChange: string;
  }>;
  transactions: {
    items: Array<{
      id: string;
      bankAccountId: string;
      bankName: string;
      accountNumber: string;
      type: "DEPOSIT" | "WITHDRAWAL";
      amount: string;
      transactionDate: string;
      referenceNumber?: string | null;
      proofAttachmentUrl?: string | null;
      notes?: string | null;
      createdByName?: string | null;
    }>;
    meta: { page: number; limit: number; total: number; totalPages: number };
  };
};

export function buildReportQueryParams(params?: ReportPeriodParams): Record<string, string | undefined> {
  const effective = getEffectiveReportPeriodParams(params);
  if (!effective) {
    return { period: "this_month" };
  }
  return {
    period: effective.period ?? "this_month",
    fromDate: effective.fromDate,
    toDate: effective.toDate,
  };
}

/** First day of current month through today (UTC), for custom range defaults. */
export function defaultCustomReportRange(): { fromDate: string; toDate: string } {
  const now = new Date();
  const toDate = now.toISOString().slice(0, 10);
  const fromDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    .toISOString()
    .slice(0, 10);
  return { fromDate, toDate };
}

export function isReportPeriodReady(params?: ReportPeriodParams): boolean {
  if (!params || params.period !== "custom") {
    return true;
  }
  return Boolean(params.fromDate?.trim() && params.toDate?.trim());
}

/** Avoid calling the API with an incomplete custom range. */
export function getEffectiveReportPeriodParams(
  params?: ReportPeriodParams,
): ReportPeriodParams | undefined {
  if (!params) {
    return { period: "this_month" };
  }
  if (params.period === "custom" && !isReportPeriodReady(params)) {
    return { period: "this_month" };
  }
  return params;
}

export function reportHref(path: string, period?: ReportPeriodParams): string {
  const search = new URLSearchParams();
  const p = period?.period ?? "this_month";
  search.set("period", p);
  if (p === "custom" && period?.fromDate) {
    search.set("fromDate", period.fromDate);
  }
  if (p === "custom" && period?.toDate) {
    search.set("toDate", period.toDate);
  }
  const qs = search.toString();
  return qs ? `${path}?${qs}` : path;
}

import { buildGetCacheKey, fetchDeduped } from "@/src/lib/api-fetch-dedupe";
import { buildReportQueryParams } from "@/src/features/reports/types/reports.types";
import { api } from "./api";

export type Paginated<T> = {
  items: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};

export type ListQueryParams = {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  stockFilter?: "low" | "out";
};

export type DateRangeQueryParams = ListQueryParams & {
  fromDate?: string;
  toDate?: string;
};

export type TableOrderSessionDetail = {
  id: string;
  status: "OPEN" | "IN_BILLING" | "CLOSED" | "CANCELLED";
  version: number;
  openedAt: string;
  inBillingAt: string | null;
  closedAt: string | null;
  notes: string | null;
  checkoutSaleId: string | null;
  primaryTableId: string | null;
  primaryTableName: string | null;
  tableNames: string[];
  tables: Array<{ tableId: string; tableName: string; isPrimary: boolean }>;
  lines: Array<{
    id: string;
    menuItemId: string;
    menuItemName: string;
    quantity: string;
    unitPrice: string;
    lineTotal: string;
  }>;
  subtotal: string;
  lineCount: number;
};

export type TableOrderSessionDeleted = {
  deleted: true;
  id: string;
};

export type TableOrderSessionUpdateResult =
  | TableOrderSessionDetail
  | TableOrderSessionDeleted;

export function isDeletedSessionUpdate(
  result: TableOrderSessionUpdateResult,
): result is TableOrderSessionDeleted {
  return "deleted" in result;
}

export type TableOrderBillingHandoff = {
  sessionId: string;
  status: string;
  version: number;
  serviceType: "DINE_IN";
  primaryTableId: string;
  primaryTableName: string;
  tableNames: string[];
  lines: Array<{
    menuItemId: string;
    name: string;
    quantity: number;
    unitPrice: number;
  }>;
  subtotal: string;
};

async function getData<T>(
  path: string,
  params?: Record<string, string | number | undefined>,
  options?: { force?: boolean },
) {
  const cacheKey = buildGetCacheKey(path, params);
  return fetchDeduped(
    cacheKey,
    async () => {
      const response = await api.get(path, { params });
      return response.data.data as T;
    },
    options,
  );
}

async function mutate<T>(method: "post" | "patch" | "delete", path: string, body?: unknown) {
  const response =
    method === "delete"
      ? await api.delete(path)
      : method === "post"
        ? await api.post(path, body)
        : await api.patch(path, body);
  return response.data.data as T;
}

function buildReportApiParams(
  params?: { period?: string; fromDate?: string; toDate?: string },
): Record<string, string | undefined> {
  return buildReportQueryParams(params as import("@/src/features/reports/types/reports.types").ReportPeriodParams);
}

export const operationsApi = {
  menuCategories: {
    list: (params?: ListQueryParams) =>
      getData<Paginated<{ id: string; name: string; catalogItemCount: number; menuItemCount: number }>>(
        "/menu-categories",
        params,
      ),
    options: () => getData<Array<{ id: string; name: string }>>("/menu-categories/options"),
    create: (name: string) => mutate("post", "/menu-categories", { name }),
    update: (id: string, name: string) => mutate("patch", `/menu-categories/${id}`, { name }),
    remove: (id: string) => mutate("delete", `/menu-categories/${id}`),
  },
  menuItems: {
    list: (params?: ListQueryParams) =>
      getData<
        Paginated<{
          id: string;
          name: string;
          menuCategoryId: string;
          categoryName: string;
          imageUrl?: string | null;
          itemType?: string | null;
          unitType?: string | null;
          unitQuantity?: string | null;
          costPerUnit: string;
          sellPricePerUnit: string;
          openingStockDay1: string;
          quantityOnHand: string | null;
          trackStock: boolean;
          reorderLevel?: string | null;
          notes?: string | null;
        }>
      >("/menu-items", params),
    sellableStock: () =>
      getData<{ id: string; name: string; quantityOnHand: string; unit?: string | null }[]>(
        "/menu-items/sellable-stock",
      ),
    stockAdjustment: (id: string, data: { quantity: number; notes?: string }) =>
      mutate("post", `/menu-items/${id}/stock-adjustments`, data),
    stockHistory: (id: string, params?: ListQueryParams) =>
      getData<
        Paginated<{
          id: string;
          delta: string;
          quantityAfter: string;
          sourceType: string;
          sourceId: string | null;
          notes?: string | null;
          createdAt: string;
        }>
      >(`/menu-items/${id}/stock-history`, params),
    create: (data: {
      menuCategoryId: string;
      name: string;
      imageUrl?: string;
      itemType?: string;
      unitType?: string;
      unitQuantity?: string;
      costPerUnit: number;
      sellPricePerUnit: number;
      openingStockDay1?: number;
      trackStock?: boolean;
      directPurchaseItemId?: string;
      reorderLevel?: number;
      notes?: string;
    }) => mutate("post", "/menu-items", data),
    update: (id: string, data: Record<string, unknown>) => mutate("patch", `/menu-items/${id}`, data),
    remove: (id: string) => mutate("delete", `/menu-items/${id}`),
  },
  stockItems: {
    list: (params?: ListQueryParams) =>
      getData<
        Paginated<{
          id: string;
          itemKind: "MENU" | "INVENTORY";
          name: string;
          unit?: string | null;
          description?: string | null;
          categoryName?: string | null;
          openingStockDay1?: string | null;
          reorderLevel?: string | null;
          quantityOnHand: string;
          stockStatus: "ok" | "low" | "out";
          createdAt: string;
        }>
      >("/stock-items", params),
    getOne: (id: string) =>
      getData<{
        id: string;
        name: string;
        unit?: string | null;
        description?: string | null;
        reorderLevel?: string | null;
        quantityOnHand: string;
        stockStatus: "ok" | "low" | "out";
      }>(`/stock-items/${id}`),
    history: (id: string, params?: ListQueryParams) =>
      getData<
        Paginated<{
          id: string;
          itemKind: string;
          delta: string;
          quantityAfter: string;
          sourceType: string;
          sourceId: string | null;
          notes?: string | null;
          createdAt: string;
        }>
      >(`/stock-items/${id}/history`, params),
    create: (data: {
      name: string;
      unit?: string;
      description?: string;
      openingQuantity?: number;
      reorderLevel?: number;
    }) => mutate("post", "/stock-items", data),
    update: (id: string, data: Record<string, unknown>) =>
      mutate("patch", `/stock-items/${id}`, data),
    stockAdjustment: (id: string, data: { quantity: number; notes?: string }) =>
      mutate("post", `/stock-items/${id}/stock-adjustments`, data),
    remove: (id: string) => mutate("delete", `/stock-items/${id}`),
  },
  stockAlerts: () =>
    getData<{
      low: Array<{
        id: string;
        kind: "MENU" | "INVENTORY";
        name: string;
        quantityOnHand: string;
        reorderLevel: string;
        unit: string | null;
      }>;
      out: Array<{
        id: string;
        kind: "MENU" | "INVENTORY";
        name: string;
        quantityOnHand: string;
        reorderLevel: string;
        unit: string | null;
      }>;
      counts: { low: number; out: number };
    }>("/stock-alerts"),
  stockMovements: {
    list: (params?: DateRangeQueryParams & { itemKind?: "MENU" | "INVENTORY"; sourceType?: string }) =>
      getData<
        Paginated<{
          id: string;
          itemKind: "MENU" | "INVENTORY";
          itemId: string;
          itemName: string;
          delta: string;
          quantityAfter: string;
          sourceType: string;
          sourceId: string | null;
          notes: string | null;
          createdAt: string;
        }>
      >("/stock-movements", params),
  },
  rawMaterials: {
    list: (params?: ListQueryParams) =>
      getData<
        Paginated<{
          id: string;
          name: string;
          unit: string;
          description?: string | null;
          createdAt: string;
        }>
      >("/raw-material-items", params),
    create: (data: { name: string; unit: string; description?: string }) =>
      mutate("post", "/raw-material-items", data),
    update: (id: string, data: Record<string, unknown>) =>
      mutate("patch", `/raw-material-items/${id}`, data),
    remove: (id: string) => mutate("delete", `/raw-material-items/${id}`),
  },
  suppliers: {
    list: (params?: ListQueryParams) =>
      getData<
        Paginated<{
          id: string;
          name: string;
          contactPerson?: string | null;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          notes?: string | null;
        }>
      >("/suppliers", params),
    create: (data: Record<string, unknown>) => mutate("post", "/suppliers", data),
    update: (id: string, data: Record<string, unknown>) => mutate("patch", `/suppliers/${id}`, data),
    remove: (id: string) => mutate("delete", `/suppliers/${id}`),
    billingSummary: (id: string) =>
      getData<{
        supplierId: string;
        supplierName: string;
        totalPurchases: number;
        totalAmount: string;
        paidAmount: string;
        outstandingAmount: string;
        overdueAmount: string;
        openBills: number;
        overdueBills: number;
        lastPaymentDate: string | null;
      }>(`/suppliers/${id}/billing-summary`),
  },
  tableOrders: {
    board: () =>
      getData<{
        items: Array<{
          tableId: string;
          tableName: string;
          status: "VACANT" | "IN_PROGRESS" | "IN_BILLING";
          sessionId: string | null;
          sessionTableNames: string[];
          subtotal: string | null;
          lineCount: number;
          lastItemName: string | null;
        }>;
      }>("/table-orders/board"),
    createSession: (data: { tableId: string }) =>
      mutate<TableOrderSessionDetail>("post", "/table-orders/sessions", data),
    getSession: (id: string) =>
      getData<TableOrderSessionDetail>(`/table-orders/sessions/${id}`),
    updateLines: (
      id: string,
      data: {
        version: number;
        lines: { menuItemId: string; quantity: number; unitPrice: number }[];
      },
    ) =>
      mutate<TableOrderSessionUpdateResult>(
        "patch",
        `/table-orders/sessions/${id}/lines`,
        data,
      ),
    merge: (id: string, data: { tableIds: string[]; version?: number }) =>
      mutate<TableOrderSessionDetail>("post", `/table-orders/sessions/${id}/merge`, data),
    unmerge: (id: string, data: { tableId: string; version?: number }) =>
      mutate<TableOrderSessionDetail>("post", `/table-orders/sessions/${id}/unmerge`, data),
    generateBill: (id: string) =>
      mutate<TableOrderBillingHandoff>("post", `/table-orders/sessions/${id}/generate-bill`, {}),
    cancelBilling: (id: string) =>
      mutate<TableOrderSessionDetail>("post", `/table-orders/sessions/${id}/cancel-billing`, {}),
    billingHandoff: (id: string) =>
      getData<TableOrderBillingHandoff>(`/table-orders/sessions/${id}/billing-handoff`),
  },
  diningTables: {
    list: (params?: ListQueryParams) =>
      getData<
        Paginated<{
          id: string;
          name: string;
          createdAt: string;
        }>
      >("/dining-tables", params),
    create: (data: { name: string }) => mutate("post", "/dining-tables", data),
    update: (id: string, data: { name: string }) => mutate("patch", `/dining-tables/${id}`, data),
    remove: (id: string) => mutate("delete", `/dining-tables/${id}`),
    options: () => getData<Array<{ id: string; name: string }>>("/dining-tables/options"),
  },
  rmPurchases: {
    list: (params?: DateRangeQueryParams) =>
      getData<Paginated<import("@/src/lib/ap-types").ApBillSummary>>(
        "/raw-material-purchases",
        params,
      ),
    getOne: (id: string) =>
      getData<import("@/src/lib/ap-types").ApBillDetail>(`/raw-material-purchases/${id}`),
    create: (data: {
      purchaseDate: string;
      notes?: string;
      supplierInvoiceNo?: string;
      paymentType: import("@/src/lib/ap-types").CreatePaymentType;
      initialPayment?: {
        amount: number;
        paymentMethod: import("@/src/lib/ap-types").PurchasePaymentMethod;
        referenceNumber?: string;
        remarks?: string;
        proofAttachmentUrl?: string;
      };
      lines: {
        rawMaterialItemId: string;
        supplierId: string;
        quantity: number;
        ratePerUnit: number;
      }[];
    }) =>
      mutate<{ purchaseGroupId: string; purchases: import("@/src/lib/ap-types").ApBillDetail[] }>(
        "post",
        "/raw-material-purchases",
        data,
      ),
    update: (
      id: string,
      data: {
        purchaseDate: string;
        notes?: string;
        supplierInvoiceNo?: string;
        lines: {
          rawMaterialItemId: string;
          supplierId: string;
          quantity: number;
          ratePerUnit: number;
        }[];
      },
    ) => mutate("patch", `/raw-material-purchases/${id}`, data),
    recordPayment: (
      id: string,
      data: {
        amount: number;
        paymentMethod: import("@/src/lib/ap-types").PurchasePaymentMethod;
        referenceNumber?: string;
        remarks?: string;
        paymentDate?: string;
        proofAttachmentUrl?: string;
      },
    ) => mutate("post", `/raw-material-purchases/${id}/payments`, data),
  },
  directPurchases: {
    list: (params?: DateRangeQueryParams) =>
      getData<Paginated<import("@/src/lib/ap-types").ApBillSummary>>(
        "/direct-purchases",
        params,
      ),
    linkOptions: () =>
      getData<
        Array<{
          id: string;
          name: string;
          unitType?: string | null;
          unitQuantity?: string | null;
          quantityOnHand?: string;
        }>
      >("/direct-purchases/link-options"),
    getOne: (id: string) =>
      getData<import("@/src/lib/ap-types").DirectApBillDetail>(`/direct-purchases/${id}`),
    create: (data: {
      purchaseDate: string;
      notes?: string;
      supplierInvoiceNo?: string;
      paymentType: import("@/src/lib/ap-types").CreatePaymentType;
      initialPayment?: {
        amount: number;
        paymentMethod: import("@/src/lib/ap-types").PurchasePaymentMethod;
        referenceNumber?: string;
        remarks?: string;
        proofAttachmentUrl?: string;
      };
      lines: {
        itemName: string;
        unitType?: string;
        unitQuantity?: string;
        supplierId: string;
        quantity: number;
        ratePerUnit: number;
      }[];
    }) =>
      mutate<{ purchaseGroupId: string; purchases: import("@/src/lib/ap-types").ApBillDetail[] }>(
        "post",
        "/direct-purchases",
        data,
      ),
    update: (
      id: string,
      data: {
        purchaseDate: string;
        notes?: string;
        supplierInvoiceNo?: string;
        lines: {
          itemName: string;
          unitType?: string;
          unitQuantity?: string;
          supplierId: string;
          quantity: number;
          ratePerUnit: number;
          directPurchaseItemId?: string;
        }[];
      },
    ) => mutate("patch", `/direct-purchases/${id}`, data),
    recordPayment: (
      id: string,
      data: {
        amount: number;
        paymentMethod: import("@/src/lib/ap-types").PurchasePaymentMethod;
        referenceNumber?: string;
        remarks?: string;
        paymentDate?: string;
        proofAttachmentUrl?: string;
      },
    ) => mutate("post", `/direct-purchases/${id}/payments`, data),
  },
  billSettlement: {
    list: (params?: {
      page?: number;
      limit?: number;
      search?: string;
      hasOutstanding?: boolean;
      fullySettled?: boolean;
      activeVendors?: boolean;
      sortBy?: "outstandingAmount" | "lastPurchaseAt" | "name";
      sortOrder?: "asc" | "desc";
    }) =>
      getData<Paginated<import("@/src/lib/ap-types").BillSettlementSupplierRow>>(
        "/bill-settlement",
        {
          ...params,
          hasOutstanding: params?.hasOutstanding ? "true" : undefined,
          fullySettled: params?.fullySettled ? "true" : undefined,
          activeVendors: params?.activeVendors ? "true" : undefined,
        },
      ),
    agingSummary: () =>
      getData<{
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
        totals: {
          current: number;
          days1_30: number;
          days31_60: number;
          days61_90: number;
          days90Plus: number;
          totalOutstanding: number;
        };
      }>("/bill-settlement/metrics/summary"),
    getSupplier: (supplierId: string) =>
      getData<import("@/src/lib/ap-types").BillSettlementSupplierDetail>(`/bill-settlement/${supplierId}`),
    previewPayment: (data: {
      supplierId: string;
      amount: number;
      paymentMethod: import("@/src/lib/ap-types").PurchasePaymentMethod;
      remarks?: string;
    }) =>
      mutate<{
        supplierId: string;
        supplierName: string;
        paymentAmount: string;
        totalOutstanding: string;
        remainingOutstanding: string;
        allocations: Array<{ purchaseId: string; receiptNo: string; amount: string }>;
      }>("post", "/bill-settlement/payments/preview", data),
    recordPayment: (data: {
      supplierId: string;
      amount: number;
      paymentMethod: import("@/src/lib/ap-types").PurchasePaymentMethod;
      remarks?: string;
    }) =>
      mutate<{
        settlementBatchId: string;
        settlementReceiptNo: string;
        supplierId: string;
        supplierName: string;
        amount: string;
        paymentMethod: import("@/src/lib/ap-types").PurchasePaymentMethod;
        remarks?: string | null;
        allocations: Array<{ purchaseId: string; receiptNo: string; amount: string }>;
      }>("post", "/bill-settlement/payments", data),
  },
  supplierReports: {
    outstanding: () =>
      getData<
        Array<{
          supplierId: string;
          supplierName: string;
          totalPurchases: number;
          totalAmount: string;
          paidAmount: string;
          outstandingAmount: string;
        }>
      >("/reports/supplier-outstanding"),
    aging: () =>
      getData<{
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
      }>("/reports/supplier-aging"),
  },
  reports: {
    summary: (params?: import("@/src/features/reports/types/reports.types").ReportPeriodParams) =>
      getData<import("@/src/features/reports/types/reports.types").ReportsSummary>(
        "/reports/summary",
        buildReportApiParams(params),
      ),
    sales: (params?: import("@/src/features/reports/types/reports.types").ReportPeriodParams) =>
      getData<import("@/src/features/reports/types/reports.types").SalesReport>(
        "/reports/sales",
        buildReportApiParams(params),
      ),
    profit: (params?: import("@/src/features/reports/types/reports.types").ReportPeriodParams) =>
      getData<import("@/src/features/reports/types/reports.types").ProfitReport>(
        "/reports/profit",
        buildReportApiParams(params),
      ),
    discounts: (
      params?: import("@/src/features/reports/types/reports.types").ReportPeriodParams &
        ListQueryParams,
    ) =>
      getData<import("@/src/features/reports/types/reports.types").DiscountReport>(
        "/reports/discounts",
        { ...buildReportApiParams(params), page: params?.page, limit: params?.limit },
      ),
    expenses: (params?: import("@/src/features/reports/types/reports.types").ReportPeriodParams) =>
      getData<import("@/src/features/reports/types/reports.types").ExpenseReport>(
        "/reports/expenses",
        buildReportApiParams(params),
      ),
    inventory: (
      params?: import("@/src/features/reports/types/reports.types").ReportPeriodParams &
        ListQueryParams,
    ) =>
      getData<import("@/src/features/reports/types/reports.types").InventoryReport>(
        "/reports/inventory",
        { ...buildReportApiParams(params), page: params?.page, limit: params?.limit },
      ),
    customerReceivables: (params?: ListQueryParams) =>
      getData<import("@/src/features/reports/types/reports.types").CustomerReceivableReport>(
        "/reports/customer-receivables",
        { page: params?.page, limit: params?.limit },
      ),
    supplierPayables: (
      params?: import("@/src/features/reports/types/reports.types").ReportPeriodParams &
        ListQueryParams,
    ) =>
      getData<import("@/src/features/reports/types/reports.types").SupplierPayableReport>(
        "/reports/supplier-payables",
        { ...buildReportApiParams(params), page: params?.page, limit: params?.limit },
      ),
    banks: (
      params?: import("@/src/features/reports/types/reports.types").ReportPeriodParams &
        ListQueryParams,
    ) =>
      getData<import("@/src/features/reports/types/reports.types").BankReport>(
        "/reports/banks",
        { ...buildReportApiParams(params), page: params?.page ?? 1, limit: params?.limit ?? 50 },
      ),
  },
  dashboard: {
    cafeMetrics: () =>
      getData<{
        outstandingBillsAmount: string;
        overdueBillsAmount: string;
        billsDueThisWeekAmount: string;
        suppliersWithOutstandingCount: number;
      }>("/dashboard/cafe-metrics"),
    customerReceivables: () =>
      getData<{
        totalOutstanding: string;
        customersWithCreditCount: number;
        overdueCreditsAmount: string;
        creditsDueThisWeekAmount: string;
        topCreditCustomers: Array<{
          id: string;
          name: string;
          phoneNumber: string;
          outstandingAmount: string;
        }>;
      }>("/dashboard/customer-receivables"),
  },
  expenseItems: {
    list: (params?: ListQueryParams) =>
      getData<
        Paginated<{
          id: string;
          displayLabel: string;
          description?: string | null;
          monthlySheetCategory: string;
          createdAt: string;
          salaryStaffUserId?: string | null;
          salaryStaffName?: string | null;
        }>
      >("/expense-items", params),
    create: (data: {
      description?: string;
      monthlySheetCategory?: string;
      salaryStaffUserId?: string;
    }) => mutate("post", "/expense-items", data),
    update: (
      id: string,
      data: {
        description?: string;
        monthlySheetCategory?: string;
        salaryStaffUserId?: string;
      },
    ) => mutate("patch", `/expense-items/${id}`, data),
    remove: (id: string) => mutate("delete", `/expense-items/${id}`),
  },
  expenseEntries: {
    list: (params?: DateRangeQueryParams) =>
      getData<
        Paginated<{
          id: string;
          expenseItemId: string;
          expenseItemName: string;
          amount: string;
          expenseDate: string;
          notes?: string | null;
          createdAt: string;
        }>
      >("/expense-entries", params),
    create: (data: { expenseItemId: string; amount: number; expenseDate: string; notes?: string }) =>
      mutate("post", "/expense-entries", data),
    update: (id: string, data: Record<string, unknown>) => mutate("patch", `/expense-entries/${id}`, data),
    remove: (id: string) => mutate("delete", `/expense-entries/${id}`),
  },
  bankAccounts: {
    list: (params?: ListQueryParams & { activeOnly?: boolean }) => {
      const { activeOnly, ...rest } = params ?? {};
      return getData<
        Paginated<{
          id: string;
          bankName: string;
          accountNumber: string;
          accountHolderName: string;
          openingBalance: string;
          currentBalance: string;
          totalDeposits: string;
          totalWithdrawals: string;
          transactionCount: number;
          isActive: boolean;
          createdAt: string;
          updatedAt: string;
        }> & {
          meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            activeAccountCount?: number;
            totalCurrentBalance?: string;
          };
        }
      >("/bank-accounts", {
        ...rest,
        ...(activeOnly ? { activeOnly: "true" } : {}),
      });
    },
    create: (data: {
      bankName: string;
      accountNumber: string;
      accountHolderName: string;
      openingBalance?: number;
    }) => mutate("post", "/bank-accounts", data),
    update: (
      id: string,
      data: {
        bankName?: string;
        accountNumber?: string;
        accountHolderName?: string;
        openingBalance?: number;
        isActive?: boolean;
      },
    ) => mutate("patch", `/bank-accounts/${id}`, data),
    remove: (id: string) => mutate("delete", `/bank-accounts/${id}`),
  },
  bankTransactions: {
    list: (
      params?: DateRangeQueryParams & {
        bankAccountId?: string;
        type?: "DEPOSIT" | "WITHDRAWAL";
      },
    ) =>
      getData<
        Paginated<{
          id: string;
          bankAccountId: string;
          bankName: string;
          accountNumber: string;
          accountHolderName: string;
          type: "DEPOSIT" | "WITHDRAWAL";
          amount: string;
          transactionDate: string;
          referenceNumber?: string | null;
          proofAttachmentUrl?: string | null;
          notes?: string | null;
          createdAt: string;
          createdByName?: string | null;
        }> & {
          meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
            totalDeposits?: string;
            totalWithdrawals?: string;
            netChange?: string;
          };
        }
      >("/bank-transactions", params),
    create: (data: {
      bankAccountId: string;
      type: "DEPOSIT" | "WITHDRAWAL";
      amount: number;
      transactionDate: string;
      referenceNumber?: string;
      proofAttachmentUrl?: string;
      notes?: string;
    }) => mutate("post", "/bank-transactions", data),
    update: (
      id: string,
      data: {
        type?: "DEPOSIT" | "WITHDRAWAL";
        amount?: number;
        transactionDate?: string;
        referenceNumber?: string;
        proofAttachmentUrl?: string;
        notes?: string;
      },
    ) => mutate("patch", `/bank-transactions/${id}`, data),
    remove: (id: string) => mutate("delete", `/bank-transactions/${id}`),
  },
  stockRemovals: {
    list: (params?: DateRangeQueryParams) =>
      getData<
        Paginated<{
          id: string;
          receiptNo: string;
          entryAt: string;
          createdAt: string;
          reason: string;
          notes?: string | null;
          staffName: string | null;
          createdByName: string | null;
          lineCount: number;
        }>
      >("/stock-removals", params),
    getOne: (id: string) =>
      getData<{
        id: string;
        receiptNo: string;
        entryAt: string;
        createdAt: string;
        reason: string;
        notes?: string | null;
        staffName: string | null;
        staffUserId?: string | null;
        createdByName: string | null;
        lineCount: number;
        lines: Array<{
          id: string;
          lineType: "MENU" | "INVENTORY";
          menuItemId: string | null;
          stockItemId: string | null;
          itemName: string;
          unit?: string | null;
          quantity: string;
        }>;
      }>(`/stock-removals/${id}`),
    lineOptions: () =>
      getData<{
        menuItems: Array<{ id: string; name: string; quantityOnHand: string; unit?: string | null }>;
        stockItems: Array<{ id: string; name: string; quantityOnHand: string; unit?: string | null }>;
      }>("/stock-removals/line-options"),
    staffOptions: () =>
      getData<{ id: string; fullName: string; staffId: string | null }[]>(
        "/stock-removals/staff-options",
      ),
    create: (data: {
      entryAt: string;
      reason: "DAMAGE" | "STAFF_USE";
      staffUserId?: string;
      notes?: string;
      lines: Array<{
        menuItemId?: string;
        stockItemId?: string;
        quantity: number;
      }>;
    }) => mutate("post", "/stock-removals", data),
    update: (
      id: string,
      data: {
        entryAt: string;
        reason: "DAMAGE" | "STAFF_USE";
        staffUserId?: string;
        notes?: string;
        lines: Array<{
          menuItemId?: string;
          stockItemId?: string;
          quantity: number;
        }>;
      },
    ) => mutate("patch", `/stock-removals/${id}`, data),
    remove: (id: string) => mutate("delete", `/stock-removals/${id}`),
  },
  assignableMenus: () =>
    getData<{ code: string; name: string }[]>("/menus/assignable"),
  staffRoles: {
    list: (params?: ListQueryParams) =>
      getData<
        Paginated<{
          id: string;
          name: string;
          description?: string | null;
          isActive: boolean;
          createdAt: string;
          staffCount: number;
          menuAccess: Array<{ menu: { code: string; name: string } }>;
        }>
      >("/staff-roles", params),
    options: () =>
      getData<Array<{ id: string; name: string; menuCount: number }>>("/staff-roles/options"),
    getById: (id: string) =>
      getData<{
        id: string;
        name: string;
        description?: string | null;
        staffCount: number;
        menuAccess: Array<{ menu: { code: string; name: string } }>;
        assignedStaff: Array<{ id: string; fullName: string; staffId: string | null }>;
      }>(`/staff-roles/${id}`),
    create: (data: { name: string; description?: string; accessMenuCodes: string[] }) =>
      mutate("post", "/staff-roles", data),
    update: (
      id: string,
      data: { name?: string; description?: string; accessMenuCodes?: string[] },
    ) => mutate("patch", `/staff-roles/${id}`, data),
    remove: (id: string) => mutate("delete", `/staff-roles/${id}`),
  },
  users: {
    staff: {
      list: (params?: ListQueryParams) =>
        getData<
          Paginated<{
            id: string;
            fullName: string;
            email: string;
            staffId: string | null;
            role: string;
            isActive: boolean;
            status?: "INVITED" | "ACTIVE" | "INACTIVE" | "LOCKED";
            contactNumber?: string | null;
            staffRole?: { id: string; name: string } | null;
            menuAccess?: Array<{ menu: { code: string; name: string } }>;
          }>
        >("/users/staff", params),
    },
  },
  sales: {
    sellableCatalog: () =>
      getData<
        Array<{
          id: string;
          name: string;
          categoryName: string;
          imageUrl?: string | null;
          trackStock: boolean;
          quantityOnHand: string | null;
          sellPricePerUnit: string;
        }>
      >("/sales/sellable-catalog"),
    list: (params?: DateRangeQueryParams & {
      serviceType?: "DINE_IN" | "DELIVERY";
      billingType?: "PAID" | "CREDIT";
      paymentStatus?: "PAID" | "PARTIAL" | "UNPAID";
      billStatus?: "OPEN" | "OVERDUE" | "CLOSED";
      hasBalance?: boolean | string;
    }) =>
      getData<
        Paginated<{
          id: string;
          receiptNo: string;
          saleAt: string;
          createdAt: string;
          serviceType: "DINE_IN" | "DELIVERY";
          billingType: "PAID" | "CREDIT";
          customerName?: string | null;
          customerPhone?: string | null;
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
          changeAmount: string;
          remainingAmount: string;
          paymentStatus: "PAID" | "PARTIAL" | "UNPAID";
          billStatus: "OPEN" | "OVERDUE" | "CLOSED";
          dueDate?: string | null;
          createdByName?: string | null;
          lineCount: number;
        }>
      >("/sales", {
        ...params,
        hasBalance:
          params?.hasBalance === true || params?.hasBalance === "true"
            ? "true"
            : undefined,
      }),
    getOne: (id: string) =>
      getData<import("@/src/lib/ar-types").SaleDetailResponse>(`/sales/${id}`),
    create: (data: {
      saleAt?: string;
      serviceType: "DINE_IN" | "DELIVERY";
      customerId?: string;
      checkoutPaymentType: "FULLY_PAID" | "PARTIALLY_PAID" | "CREDIT";
      initialPayments?: Array<{
        amount: number;
        paymentMethod: "CASH" | "BANK_TRANSFER" | "ESEWA" | "KHALTI" | "CHEQUE";
        referenceNumber?: string;
        chequeBankName?: string;
        remarks?: string;
        proofAttachmentUrl?: string;
      }>;
      paymentTermsPreset?: string;
      customDueDate?: string;
      customerName?: string;
      customerPhone?: string;
      customerEmail?: string;
      customerAddress?: string;
      tableId?: string;
      otherChargeAmount: number;
      discountAmount?: number;
      discountPercent?: number;
      notes?: string;
      diningSessionId?: string;
      lines: { menuItemId: string; quantity: number; unitPrice: number }[];
    }) =>
      mutate<{ id: string; receiptNo: string; grandTotal: string }>("post", "/sales", data),
    recordPayment: (
      saleId: string,
      data: {
        amount: number;
        paymentMethod: "CASH" | "BANK_TRANSFER" | "ESEWA" | "KHALTI" | "CHEQUE";
        referenceNumber?: string;
        chequeBankName?: string;
        remarks?: string;
        paymentDate?: string;
      },
    ) => mutate<import("@/src/lib/ar-types").SalePaymentRow>("post", `/sales/${saleId}/payments`, data),
  },
  customers: {
    search: (params?: { q?: string; limit?: number }) =>
      getData<{ items: import("@/src/lib/ar-types").CustomerSearchHit[] }>(
        "/customers/search",
        params,
      ),
    create: (data: {
      name: string;
      phoneNumber: string;
      address?: string;
      email?: string;
      notes?: string;
    }) =>
      mutate<import("@/src/lib/ar-types").CustomerSearchHit>("post", "/customers", data),
    summary: (id: string) =>
      getData<{
        totalVisits: number;
        averageBillAmount: string;
        lastPurchaseDate: string | null;
        mostPurchasedItems: Array<{
          menuItemId: string;
          name: string;
          totalQuantity: string;
        }>;
      }>(`/customers/${id}/summary`),
  },
  customerReceivables: {
    list: (params?: {
      page?: number;
      limit?: number;
      search?: string;
      hasOutstanding?: boolean;
      fullySettled?: boolean;
      activeCustomers?: boolean;
      sortBy?: "outstandingAmount" | "lastVisitAt" | "name";
      sortOrder?: "asc" | "desc";
    }) =>
      getData<Paginated<import("@/src/lib/ar-types").CustomerReceivableListRow>>(
        "/customer-receivables",
        {
          ...params,
          hasOutstanding:
            params?.hasOutstanding === true ? "true" : undefined,
          fullySettled: params?.fullySettled === true ? "true" : undefined,
          activeCustomers:
            params?.activeCustomers === true ? "true" : undefined,
        },
      ),
    agingSummary: () =>
      getData<{
        totals: {
          current: number;
          days1_30: number;
          days31_60: number;
          days61_90: number;
          days90Plus: number;
          totalOutstanding: number;
        };
      }>("/customer-receivables/metrics/summary"),
    getCustomer: (customerId: string) =>
      getData<import("@/src/lib/ar-types").CustomerReceivableDetail>(
        `/customer-receivables/${customerId}`,
      ),
    previewPayment: (data: {
      customerId: string;
      amount: number;
      paymentMethod: import("@/src/lib/ar-types").SalePaymentMethod;
      remarks?: string;
    }) =>
      mutate<import("@/src/lib/ar-types").FifoAllocationPreview>(
        "post",
        "/customer-receivables/payments/preview",
        data,
      ),
    recordPayment: (data: {
      customerId: string;
      amount: number;
      paymentMethod: import("@/src/lib/ar-types").SalePaymentMethod;
      remarks?: string;
    }) =>
      mutate<{
        id: string;
        receiptNo: string;
        amount: string;
        allocations: Array<{ saleId: string; receiptNo: string; amount: string }>;
      }>("post", "/customer-receivables/payments", data),
  },
  supplierBills: {
    list: (params?: {
      page?: number;
      limit?: number;
      search?: string;
      hasOutstanding?: boolean;
      fullySettled?: boolean;
      activeVendors?: boolean;
      sortBy?: "outstandingAmount" | "lastPurchaseAt" | "name";
      sortOrder?: "asc" | "desc";
    }) =>
      getData<Paginated<import("@/src/lib/ap-types").BillSettlementSupplierRow>>(
        "/bill-settlement",
        {
          ...params,
          hasOutstanding: params?.hasOutstanding ? "true" : undefined,
          fullySettled: params?.fullySettled ? "true" : undefined,
          activeVendors: params?.activeVendors ? "true" : undefined,
        },
      ),
    agingSummary: () =>
      getData<{
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
        totals: {
          current: number;
          days1_30: number;
          days31_60: number;
          days61_90: number;
          days90Plus: number;
          totalOutstanding: number;
        };
      }>("/bill-settlement/metrics/summary"),
  },
};

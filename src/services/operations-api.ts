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

async function getData<T>(path: string, params?: Record<string, string | number | undefined>) {
  const response = await api.get(path, { params });
  return response.data.data as T;
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

export const operationsApi = {
  menuCategories: {
    list: (params?: ListQueryParams) =>
      getData<Paginated<{ id: string; name: string; catalogItemCount: number; menuItemCount: number }>>(
        "/menu-categories",
        params,
      ),
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
          unitType?: string | null;
          unitQuantity?: string | null;
          costPerUnit: string;
          sellPricePerUnit: string;
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
      unitType?: string;
      unitQuantity?: string;
      costPerUnit: number;
      sellPricePerUnit: number;
      openingStockDay1?: number;
      trackStock?: boolean;
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
      paymentTermsPreset: import("@/src/lib/ap-types").PaymentTermsPreset;
      dueDate?: string;
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
    updateHeader: (
      id: string,
      data: {
        notes?: string;
        dueDate?: string;
        paymentTermsPreset?: import("@/src/lib/ap-types").PaymentTermsPreset;
        paymentTermsDays?: number;
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
  supplierBills: {
    list: (params?: ListQueryParams & {
      supplierId?: string;
      paymentStatus?: string;
      billStatus?: string;
      fromDate?: string;
      toDate?: string;
      dueFrom?: string;
      dueTo?: string;
      dueWithinDays?: number;
      hasOutstanding?: string;
    }) =>
      getData<Paginated<import("@/src/lib/ap-types").ApBillSummary>>("/supplier-bills", params),
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
      }>("/supplier-bills/metrics/summary"),
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
  dashboard: {
    cafeMetrics: () =>
      getData<{
        outstandingBillsAmount: string;
        overdueBillsAmount: string;
        billsDueThisWeekAmount: string;
        suppliersWithOutstandingCount: number;
      }>("/dashboard/cafe-metrics"),
  },
  expenseItems: {
    list: (params?: ListQueryParams) =>
      getData<
        Paginated<{
          id: string;
          name: string;
          description?: string | null;
          monthlySheetCategory: string;
          createdAt: string;
          salaryStaffUserId?: string | null;
          salaryStaffName?: string | null;
        }>
      >("/expense-items", params),
    create: (data: {
      name: string;
      description?: string;
      monthlySheetCategory?: string;
      salaryStaffUserId?: string;
    }) => mutate("post", "/expense-items", data),
    update: (
      id: string,
      data: {
        name?: string;
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
    remove: (id: string) => mutate("delete", `/stock-removals/${id}`),
  },
  assignableMenus: () =>
    getData<{ code: string; name: string }[]>("/menus/assignable"),
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
      checkoutPaymentType: "FULLY_PAID" | "PARTIALLY_PAID" | "CREDIT";
      initialPayments?: Array<{
        amount: number;
        paymentMethod: "CASH" | "BANK_TRANSFER" | "CHEQUE";
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
      lines: { menuItemId: string; quantity: number; unitPrice: number }[];
    }) =>
      mutate<{ id: string; receiptNo: string; grandTotal: string }>("post", "/sales", data),
    recordPayment: (
      saleId: string,
      data: {
        amount: number;
        paymentMethod: "CASH" | "BANK_TRANSFER" | "CHEQUE";
        referenceNumber?: string;
        chequeBankName?: string;
        remarks?: string;
        paymentDate?: string;
      },
    ) => mutate<import("@/src/lib/ar-types").SalePaymentRow>("post", `/sales/${saleId}/payments`, data),
  },
  customerReceivables: {
    list: (params?: {
      page?: number;
      limit?: number;
      search?: string;
      customerId?: string;
      paymentStatus?: "PAID" | "PARTIAL" | "UNPAID";
      billStatus?: "OPEN" | "OVERDUE" | "CLOSED";
    }) =>
      getData<
        Paginated<{
          id: string;
          receiptNo: string;
          saleAt: string;
          customerName?: string | null;
          customerPhone?: string | null;
          grandTotal: string;
          paidAmount: string;
          remainingAmount: string;
          paymentStatus: "PAID" | "PARTIAL" | "UNPAID";
          billStatus: "OPEN" | "OVERDUE" | "CLOSED";
          dueDate?: string | null;
          lineCount: number;
        }>
      >("/customer-receivables", params),
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
    getOne: (id: string) =>
      getData<import("@/src/lib/ar-types").SaleDetailResponse>(`/customer-receivables/${id}`),
  },
};

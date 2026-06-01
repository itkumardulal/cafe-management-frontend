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
          quantityOnHand: string;
          notes?: string | null;
        }>
      >("/menu-items", params),
    sellableStock: () =>
      getData<{ id: string; name: string; quantityOnHand: string }[]>("/menu-items/sellable-stock"),
    create: (data: {
      menuCategoryId: string;
      name: string;
      imageUrl?: string;
      unitType?: string;
      unitQuantity?: string;
      costPerUnit: number;
      sellPricePerUnit: number;
      openingStockDay1: number;
      notes?: string;
    }) => mutate("post", "/menu-items", data),
    update: (id: string, data: Record<string, unknown>) => mutate("patch", `/menu-items/${id}`, data),
    remove: (id: string) => mutate("delete", `/menu-items/${id}`),
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
      getData<
        Paginated<{
          id: string;
          receiptNo: string;
          purchaseDate: string;
          createdAt: string;
          notes?: string | null;
          lineCount: number;
          billingType: "PAID" | "CREDIT";
          grandTotal: string;
          cashPaidAmount: string;
          bankPaidAmount: string;
          creditAmount: string;
          bankPaymentScreenshotUrl?: string | null;
        }>
      >("/raw-material-purchases", params),
    getOne: (id: string) =>
      getData<{
        id: string;
        receiptNo: string;
        purchaseDate: string;
        createdAt: string;
        notes?: string | null;
        createdByName?: string | null;
        lineCount: number;
        billingType: "PAID" | "CREDIT";
        grandTotal: string;
        cashPaidAmount: string;
        bankPaidAmount: string;
        creditAmount: string;
        bankPaymentScreenshotUrl?: string | null;
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
      }>(`/raw-material-purchases/${id}`),
    create: (data: {
      purchaseDate: string;
      notes?: string;
      billingType: "PAID" | "CREDIT";
      cashPaidAmount: number;
      bankPaidAmount: number;
      bankPaymentScreenshotUrl?: string;
      lines: { rawMaterialItemId: string; supplierId: string; quantity: number; ratePerUnit: number }[];
    }) => mutate("post", "/raw-material-purchases", data),
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
          menuItemId: string;
          menuItemName: string;
          quantity: string;
        }>;
      }>(`/stock-removals/${id}`),
    staffOptions: () =>
      getData<{ id: string; fullName: string; staffId: string | null }[]>(
        "/stock-removals/staff-options",
      ),
    create: (data: {
      entryAt: string;
      reason: "DAMAGE" | "STAFF_USE";
      staffUserId?: string;
      notes?: string;
      lines: { menuItemId: string; quantity: number }[];
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
          quantityOnHand: string;
          sellPricePerUnit: string;
        }>
      >("/sales/sellable-catalog"),
    list: (params?: DateRangeQueryParams & {
      serviceType?: "DINE_IN" | "DELIVERY";
      billingType?: "PAID" | "CREDIT";
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
          createdByName?: string | null;
          lineCount: number;
        }>
      >("/sales", params),
    getOne: (id: string) =>
      getData<{
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
        notes?: string | null;
        createdByName?: string | null;
        lineCount: number;
        cafe?: {
          cafeName: string;
          address?: string | null;
          contactNumber?: string | null;
          email?: string;
        };
        lines: Array<{
          id: string;
          menuItemId: string;
          menuItemName: string;
          quantity: string;
          unitPrice: string;
          lineTotal: string;
        }>;
      }>(`/sales/${id}`),
    create: (data: {
      saleAt?: string;
      serviceType: "DINE_IN" | "DELIVERY";
      billingType: "PAID" | "CREDIT";
      customerName?: string;
      customerPhone?: string;
      customerEmail?: string;
      customerAddress?: string;
      tableId?: string;
      otherChargeAmount: number;
      discountAmount?: number;
      discountPercent?: number;
      cashPaidAmount: number;
      bankPaidAmount?: number;
      notes?: string;
      lines: { menuItemId: string; quantity: number; unitPrice: number }[];
    }) =>
      mutate<{
        id: string;
        receiptNo: string;
        saleAt: string;
        serviceType: "DINE_IN" | "DELIVERY";
        billingType: "PAID" | "CREDIT";
        grandTotal: string;
      }>("post", "/sales", data),
  },
};

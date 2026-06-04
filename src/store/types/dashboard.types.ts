import type { LoadStatus } from "./load-status";

export type ApMetrics = {
  outstandingBillsAmount: string;
  overdueBillsAmount: string;
  billsDueThisWeekAmount: string;
  suppliersWithOutstandingCount: number;
};

export type ArMetrics = {
  totalOutstanding: string;
  customersWithCreditCount: number;
  overdueCreditsAmount: string;
  topCreditCustomers: Array<{
    id: string;
    name: string;
    phoneNumber: string;
    outstandingAmount: string;
  }>;
};

export type StockAlertPreviewItem = {
  id: string;
  kind: string;
  name: string;
  quantityOnHand: string;
};

export type StockAlertsPreview = {
  counts: { low: number; out: number };
  low: StockAlertPreviewItem[];
};

export interface DashboardState {
  apMetrics: ApMetrics | null;
  arMetrics: ArMetrics | null;
  stockAlerts: StockAlertsPreview | null;
  cafeAdminDashboardStatus: LoadStatus;
  stockAlertsStatus: LoadStatus;
}

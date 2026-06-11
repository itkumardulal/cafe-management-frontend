import type { LoadStatus } from "./load-status";

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
  stockAlerts: StockAlertsPreview | null;
  stockAlertsStatus: LoadStatus;
}

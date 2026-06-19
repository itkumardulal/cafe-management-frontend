export type AssetStatus = "ACTIVE" | "UNDER_MAINTENANCE" | "DAMAGED" | "DISPOSED";

export type AssetCategoryRow = {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AssetRow = {
  id: string;
  assetCode: string;
  assetName: string;
  assetCategoryId: string;
  categoryName?: string | null;
  purchaseDate: string;
  purchaseCost: string;
  warrantyExpiryDate?: string | null;
  status: AssetStatus;
  remarks?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AssetDetail = AssetRow & {
  maintenanceSummary: {
    totalCount: number;
    totalCost: string;
  };
  maintenanceHistory: Array<{
    id: string;
    maintenanceDate: string;
    description?: string | null;
    maintenanceCost: string;
    remarks?: string | null;
    recordAsExpense: boolean;
    expenseEntryId?: string | null;
    createdBy: { id: string; name: string } | null;
    createdAt: string;
  }>;
};

export type AssetMaintenanceRow = {
  id: string;
  assetId: string;
  assetCode?: string | null;
  assetName?: string | null;
  maintenanceDate: string;
  maintenanceCost: string;
  description?: string | null;
  remarks?: string | null;
  recordAsExpense: boolean;
  expenseEntryId?: string | null;
  createdBy: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
};

export type AssetCategoryOption = {
  id: string;
  name: string;
  displayLabel: string;
};

export type AssetOption = {
  id: string;
  assetCode: string;
  assetName: string;
  displayLabel: string;
};

export type AssetsSummary = {
  totalAssets: number;
  totalAssetValue: string;
  assetsUnderMaintenance: number;
  warrantyExpiringSoon: number;
  warrantyExpiringWithinDays: number;
};

export const ASSET_WARRANTY_EXPIRING_DAYS = 30;

export type AssetWarrantyFilter = "" | "expiring" | "has";

export function getWarrantyDaysRemaining(expiry: string | null | undefined): number | null {
  if (!expiry) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(`${expiry.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(exp.getTime())) return null;
  return Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatWarrantyRemaining(expiry: string | null | undefined): string {
  const days = getWarrantyDaysRemaining(expiry);
  if (days == null) return "—";
  if (days < 0) return `Expired ${Math.abs(days)}d ago`;
  if (days === 0) return "Expires today";
  return `${days}d left`;
}

export const ASSET_STATUS_OPTIONS: Array<{ value: AssetStatus; label: string }> = [
  { value: "ACTIVE", label: "Active" },
  { value: "UNDER_MAINTENANCE", label: "Under maintenance" },
  { value: "DAMAGED", label: "Damaged" },
  { value: "DISPOSED", label: "Disposed" },
];

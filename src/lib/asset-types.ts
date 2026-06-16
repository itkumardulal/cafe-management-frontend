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

export const ASSET_STATUS_OPTIONS: Array<{ value: AssetStatus; label: string }> = [
  { value: "ACTIVE", label: "Active" },
  { value: "UNDER_MAINTENANCE", label: "Under maintenance" },
  { value: "DAMAGED", label: "Damaged" },
  { value: "DISPOSED", label: "Disposed" },
];

import type { LoadStatus } from "./load-status";

export type MenuCategoryOption = {
  id: string;
  name: string;
};

export type SellableCatalogItem = {
  id: string;
  name: string;
  categoryName: string;
  sellPricePerUnit: string;
  quantityOnHand: string | null;
  trackStock: boolean;
  imageUrl?: string | null;
};

export type DiningTableOption = {
  id: string;
  name: string;
};

export type StockRemovalLineOptions = {
  menuItems: Array<{ id: string; name: string; quantityOnHand: string; unit?: string | null }>;
  stockItems: Array<{ id: string; name: string; quantityOnHand: string; unit?: string | null }>;
};

export type StockRemovalStaffOption = {
  id: string;
  fullName: string;
  staffId: string | null;
};

export type BillSettlementAgingTotals = {
  totals: {
    current: number;
    days1_30: number;
    days31_60: number;
    days61_90: number;
    days90Plus: number;
    totalOutstanding: number;
  };
};

export interface ReferenceDataState {
  menuCategoryOptions: MenuCategoryOption[];
  menuCategoryOptionsStatus: LoadStatus;
  sellableCatalog: SellableCatalogItem[];
  sellableCatalogStatus: LoadStatus;
  diningTableOptions: DiningTableOption[];
  diningTableOptionsStatus: LoadStatus;
  stockRemovalLineOptions: StockRemovalLineOptions | null;
  stockRemovalStaffOptions: StockRemovalStaffOption[];
  stockRemovalRefsStatus: LoadStatus;
  billSettlementAging: BillSettlementAgingTotals | null;
  billSettlementAgingStatus: LoadStatus;
}

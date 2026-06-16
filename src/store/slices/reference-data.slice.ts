"use client";

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { operationsApi } from "@/src/services/operations-api";
import { logoutThunk, sessionExpiredThunk } from "@/src/store/slices/auth.slice";
import type { FetchForceArg } from "@/src/store/types/fetch-args";
import type { LoadStatus } from "@/src/store/types/load-status";
import type {
  BillSettlementAgingTotals,
  DiningTableOption,
  MenuCategoryOption,
  ReferenceDataState,
  SellableCatalogItem,
  StockRemovalLineOptions,
  StockRemovalStaffOption,
  AssetCategoryOption,
  AssetOption,
} from "@/src/store/types/reference-data.types";

const initialState: ReferenceDataState = {
  menuCategoryOptions: [],
  menuCategoryOptionsStatus: "idle",
  sellableCatalog: [],
  sellableCatalogStatus: "idle",
  diningTableOptions: [],
  diningTableOptionsStatus: "idle",
  stockRemovalLineOptions: null,
  stockRemovalStaffOptions: [],
  stockRemovalRefsStatus: "idle",
  billSettlementAging: null,
  billSettlementAgingStatus: "idle",
  assetCategoryOptions: [],
  assetCategoryOptionsStatus: "idle",
  assetOptions: [],
  assetOptionsStatus: "idle",
};

function shouldFetch(status: LoadStatus, force?: boolean): boolean {
  if (force) {
    return true;
  }
  return status !== "loaded" && status !== "loading";
}

export const fetchMenuCategoryOptionsThunk = createAsyncThunk<
  MenuCategoryOption[],
  FetchForceArg,
  { rejectValue: string; state: { referenceData: ReferenceDataState } }
>("referenceData/fetchMenuCategoryOptions", async (_, { rejectWithValue }) => {
  try {
    return await operationsApi.menuCategories.options();
  } catch {
    return rejectWithValue("Failed to load categories");
  }
}, {
  condition: (arg, { getState }) =>
    shouldFetch(getState().referenceData.menuCategoryOptionsStatus, arg?.force),
});

export const fetchSellableCatalogThunk = createAsyncThunk<
  SellableCatalogItem[],
  FetchForceArg,
  { rejectValue: string; state: { referenceData: ReferenceDataState } }
>("referenceData/fetchSellableCatalog", async (_, { rejectWithValue }) => {
  try {
    return (await operationsApi.sales.sellableCatalog()) as SellableCatalogItem[];
  } catch {
    return rejectWithValue("Failed to load menu catalog");
  }
}, {
  condition: (arg, { getState }) =>
    shouldFetch(getState().referenceData.sellableCatalogStatus, arg?.force),
});

export const fetchDiningTableOptionsThunk = createAsyncThunk<
  DiningTableOption[],
  FetchForceArg,
  { rejectValue: string; state: { referenceData: ReferenceDataState } }
>("referenceData/fetchDiningTableOptions", async (_, { rejectWithValue }) => {
  try {
    return await operationsApi.diningTables.options();
  } catch {
    return rejectWithValue("Failed to load tables");
  }
}, {
  condition: (arg, { getState }) =>
    shouldFetch(getState().referenceData.diningTableOptionsStatus, arg?.force),
});

export const fetchStockRemovalRefsThunk = createAsyncThunk<
  { lineOptions: StockRemovalLineOptions; staffOptions: StockRemovalStaffOption[] },
  FetchForceArg,
  { rejectValue: string; state: { referenceData: ReferenceDataState } }
>("referenceData/fetchStockRemovalRefs", async (_, { rejectWithValue }) => {
  try {
    const [lineOptions, staffOptions] = await Promise.all([
      operationsApi.stockRemovals.lineOptions(),
      operationsApi.stockRemovals.staffOptions(),
    ]);
    return { lineOptions, staffOptions };
  } catch {
    return rejectWithValue("Failed to load stock removal options");
  }
}, {
  condition: (arg, { getState }) =>
    shouldFetch(getState().referenceData.stockRemovalRefsStatus, arg?.force),
});

export const fetchBillSettlementAgingThunk = createAsyncThunk<
  BillSettlementAgingTotals,
  FetchForceArg,
  { rejectValue: string; state: { referenceData: ReferenceDataState } }
>("referenceData/fetchBillSettlementAging", async (_, { rejectWithValue }) => {
  try {
    return (await operationsApi.billSettlement.agingSummary()) as BillSettlementAgingTotals;
  } catch {
    return rejectWithValue("Failed to load aging summary");
  }
}, {
  condition: (arg, { getState }) =>
    shouldFetch(getState().referenceData.billSettlementAgingStatus, arg?.force),
});

export const fetchAssetCategoryOptionsThunk = createAsyncThunk<
  AssetCategoryOption[],
  FetchForceArg,
  { rejectValue: string; state: { referenceData: ReferenceDataState } }
>("referenceData/fetchAssetCategoryOptions", async (_, { rejectWithValue }) => {
  try {
    return await operationsApi.assetCategories.options();
  } catch {
    return rejectWithValue("Failed to load asset categories");
  }
}, {
  condition: (arg, { getState }) =>
    shouldFetch(getState().referenceData.assetCategoryOptionsStatus, arg?.force),
});

export const fetchAssetOptionsThunk = createAsyncThunk<
  AssetOption[],
  FetchForceArg,
  { rejectValue: string; state: { referenceData: ReferenceDataState } }
>("referenceData/fetchAssetOptions", async (_, { rejectWithValue }) => {
  try {
    return await operationsApi.assets.options();
  } catch {
    return rejectWithValue("Failed to load assets");
  }
}, {
  condition: (arg, { getState }) =>
    shouldFetch(getState().referenceData.assetOptionsStatus, arg?.force),
});

const referenceDataSlice = createSlice({
  name: "referenceData",
  initialState,
  reducers: {
    invalidateMenuCategoryOptions(state) {
      state.menuCategoryOptionsStatus = "idle";
    },
    invalidateSellableCatalog(state) {
      state.sellableCatalogStatus = "idle";
    },
    invalidateDiningTableOptions(state) {
      state.diningTableOptionsStatus = "idle";
    },
    invalidateStockRemovalRefs(state) {
      state.stockRemovalRefsStatus = "idle";
    },
    invalidateBillSettlementAging(state) {
      state.billSettlementAgingStatus = "idle";
    },
    invalidateAssetCategoryOptions(state) {
      state.assetCategoryOptionsStatus = "idle";
    },
    invalidateAssetOptions(state) {
      state.assetOptionsStatus = "idle";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMenuCategoryOptionsThunk.pending, (state) => {
        state.menuCategoryOptionsStatus = "loading";
      })
      .addCase(fetchMenuCategoryOptionsThunk.fulfilled, (state, action) => {
        state.menuCategoryOptionsStatus = "loaded";
        state.menuCategoryOptions = action.payload;
      })
      .addCase(fetchMenuCategoryOptionsThunk.rejected, (state) => {
        state.menuCategoryOptionsStatus = "error";
      })
      .addCase(fetchSellableCatalogThunk.pending, (state) => {
        state.sellableCatalogStatus = "loading";
      })
      .addCase(fetchSellableCatalogThunk.fulfilled, (state, action) => {
        state.sellableCatalogStatus = "loaded";
        state.sellableCatalog = action.payload;
      })
      .addCase(fetchSellableCatalogThunk.rejected, (state) => {
        state.sellableCatalogStatus = "error";
      })
      .addCase(fetchDiningTableOptionsThunk.pending, (state) => {
        state.diningTableOptionsStatus = "loading";
      })
      .addCase(fetchDiningTableOptionsThunk.fulfilled, (state, action) => {
        state.diningTableOptionsStatus = "loaded";
        state.diningTableOptions = action.payload;
      })
      .addCase(fetchDiningTableOptionsThunk.rejected, (state) => {
        state.diningTableOptionsStatus = "error";
      })
      .addCase(fetchStockRemovalRefsThunk.pending, (state) => {
        state.stockRemovalRefsStatus = "loading";
      })
      .addCase(fetchStockRemovalRefsThunk.fulfilled, (state, action) => {
        state.stockRemovalRefsStatus = "loaded";
        state.stockRemovalLineOptions = action.payload.lineOptions;
        state.stockRemovalStaffOptions = action.payload.staffOptions;
      })
      .addCase(fetchStockRemovalRefsThunk.rejected, (state) => {
        state.stockRemovalRefsStatus = "error";
      })
      .addCase(fetchBillSettlementAgingThunk.pending, (state) => {
        state.billSettlementAgingStatus = "loading";
      })
      .addCase(fetchBillSettlementAgingThunk.fulfilled, (state, action) => {
        state.billSettlementAgingStatus = "loaded";
        state.billSettlementAging = action.payload;
      })
      .addCase(fetchBillSettlementAgingThunk.rejected, (state) => {
        state.billSettlementAgingStatus = "error";
      })
      .addCase(fetchAssetCategoryOptionsThunk.pending, (state) => {
        state.assetCategoryOptionsStatus = "loading";
      })
      .addCase(fetchAssetCategoryOptionsThunk.fulfilled, (state, action) => {
        state.assetCategoryOptionsStatus = "loaded";
        state.assetCategoryOptions = action.payload;
      })
      .addCase(fetchAssetCategoryOptionsThunk.rejected, (state) => {
        state.assetCategoryOptionsStatus = "error";
      })
      .addCase(fetchAssetOptionsThunk.pending, (state) => {
        state.assetOptionsStatus = "loading";
      })
      .addCase(fetchAssetOptionsThunk.fulfilled, (state, action) => {
        state.assetOptionsStatus = "loaded";
        state.assetOptions = action.payload;
      })
      .addCase(fetchAssetOptionsThunk.rejected, (state) => {
        state.assetOptionsStatus = "error";
      })
      .addCase(logoutThunk.fulfilled, () => initialState)
      .addCase(sessionExpiredThunk.fulfilled, () => initialState);
  },
});

export const {
  invalidateMenuCategoryOptions,
  invalidateSellableCatalog,
  invalidateDiningTableOptions,
  invalidateStockRemovalRefs,
  invalidateBillSettlementAging,
  invalidateAssetCategoryOptions,
  invalidateAssetOptions,
} = referenceDataSlice.actions;
export default referenceDataSlice.reducer;

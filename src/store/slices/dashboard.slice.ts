"use client";

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { operationsApi } from "@/src/services/operations-api";
import { logoutThunk, sessionExpiredThunk } from "@/src/store/slices/auth.slice";
import type { FetchForceArg } from "@/src/store/types/fetch-args";
import type { DashboardState, StockAlertsPreview } from "@/src/store/types/dashboard.types";

const initialState: DashboardState = {
  stockAlerts: null,
  stockAlertsStatus: "idle",
};

function toStockAlertsPreview(data: {
  counts: { low: number; out: number };
  low: Array<{ id: string; kind: string; name: string; quantityOnHand: string }>;
}): StockAlertsPreview {
  return {
    counts: data.counts,
    low: data.low.slice(0, 5).map((item) => ({
      id: item.id,
      kind: item.kind,
      name: item.name,
      quantityOnHand: item.quantityOnHand,
    })),
  };
}

function shouldFetchStockAlerts(
  status: DashboardState["stockAlertsStatus"],
  force: boolean,
): boolean {
  if (force) {
    return true;
  }
  return status === "idle";
}

/** Sidebar badge + dashboard low-stock card — single owner for /stock-alerts. */
export const fetchStockAlertsThunk = createAsyncThunk<
  StockAlertsPreview,
  FetchForceArg,
  { rejectValue: string; state: { dashboard: DashboardState } }
>("dashboard/fetchStockAlerts", async (_, { rejectWithValue }) => {
  try {
    const data = await operationsApi.stockAlerts();
    return toStockAlertsPreview(data);
  } catch {
    return rejectWithValue("Failed to load stock alerts");
  }
}, {
  condition: (arg, { getState }) => {
    const force = Boolean(arg && typeof arg === "object" && arg.force);
    return shouldFetchStockAlerts(getState().dashboard.stockAlertsStatus, force);
  },
});

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    invalidateStockAlerts(state) {
      state.stockAlertsStatus = "idle";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStockAlertsThunk.pending, (state) => {
        state.stockAlertsStatus = "loading";
      })
      .addCase(fetchStockAlertsThunk.fulfilled, (state, action) => {
        state.stockAlertsStatus = "loaded";
        state.stockAlerts = action.payload;
      })
      .addCase(fetchStockAlertsThunk.rejected, (state) => {
        state.stockAlertsStatus = "error";
      })
      .addCase(logoutThunk.fulfilled, () => initialState)
      .addCase(sessionExpiredThunk.fulfilled, () => initialState);
  },
});

export const { invalidateStockAlerts } = dashboardSlice.actions;
export default dashboardSlice.reducer;

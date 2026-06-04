"use client";

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { operationsApi } from "@/src/services/operations-api";
import { logoutThunk, sessionExpiredThunk } from "@/src/store/slices/auth.slice";
import type { FetchForceArg } from "@/src/store/types/fetch-args";
import type {
  ApMetrics,
  ArMetrics,
  DashboardState,
  StockAlertsPreview,
} from "@/src/store/types/dashboard.types";

const initialState: DashboardState = {
  apMetrics: null,
  arMetrics: null,
  stockAlerts: null,
  cafeAdminDashboardStatus: "idle",
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
  return status !== "loaded" && status !== "loading";
}

export const fetchCafeAdminDashboardThunk = createAsyncThunk<
  { apMetrics: ApMetrics; arMetrics: ArMetrics },
  FetchForceArg,
  { rejectValue: string; state: { dashboard: DashboardState } }
>("dashboard/fetchCafeAdmin", async (_, { rejectWithValue }) => {
  try {
    const [apMetrics, arMetrics] = await Promise.all([
      operationsApi.dashboard.cafeMetrics(),
      operationsApi.dashboard.customerReceivables(),
    ]);
    return { apMetrics, arMetrics };
  } catch {
    return rejectWithValue("Failed to load dashboard");
  }
}, {
  condition: (arg, { getState }) => {
    if (arg && typeof arg === "object" && arg.force) {
      return true;
    }
    const status = getState().dashboard.cafeAdminDashboardStatus;
    return status !== "loaded" && status !== "loading";
  },
});

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
    invalidateCafeAdminDashboard(state) {
      state.cafeAdminDashboardStatus = "idle";
    },
    invalidateStockAlerts(state) {
      state.stockAlertsStatus = "idle";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCafeAdminDashboardThunk.pending, (state) => {
        state.cafeAdminDashboardStatus = "loading";
      })
      .addCase(fetchCafeAdminDashboardThunk.fulfilled, (state, action) => {
        state.cafeAdminDashboardStatus = "loaded";
        state.apMetrics = action.payload.apMetrics;
        state.arMetrics = action.payload.arMetrics;
      })
      .addCase(fetchCafeAdminDashboardThunk.rejected, (state) => {
        state.cafeAdminDashboardStatus = "error";
      })
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

export const { invalidateCafeAdminDashboard, invalidateStockAlerts } = dashboardSlice.actions;
export default dashboardSlice.reducer;

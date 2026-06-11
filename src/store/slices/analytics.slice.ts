"use client";

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type {
  AnalyticsOverview,
  AnalyticsPeriodParams,
} from "@/src/features/analytics/types/analytics.types";
import { analyticsCacheKey } from "@/src/features/analytics/types/analytics.types";
import { operationsApi } from "@/src/services/operations-api";
import { logoutThunk, sessionExpiredThunk } from "@/src/store/slices/auth.slice";
import type { FetchForceArg } from "@/src/store/types/fetch-args";

const CACHE_TTL_MS = 5 * 60 * 1000;

export type AnalyticsState = {
  filter: AnalyticsPeriodParams;
  cache: Record<string, { overview: AnalyticsOverview; fetchedAt: number }>;
  status: "idle" | "loading" | "loaded" | "error";
  error: string | null;
};

const initialState: AnalyticsState = {
  filter: { period: "this_month" },
  cache: {},
  status: "idle",
  error: null,
};

export const fetchAnalyticsOverviewThunk = createAsyncThunk<
  { key: string; overview: AnalyticsOverview; filter: AnalyticsPeriodParams },
  AnalyticsPeriodParams | undefined,
  { rejectValue: string; state: { analytics: AnalyticsState } }
>(
  "analytics/fetchOverview",
  async (params, { rejectWithValue }) => {
    const filter = params ?? { period: "this_month" };
    try {
      const overview = await operationsApi.analytics.overview(filter);
      return { key: analyticsCacheKey(filter), overview, filter };
    } catch {
      return rejectWithValue("Failed to load analytics");
    }
  },
  {
    condition: (params, { getState }) => {
      const filter = params ?? getState().analytics.filter;
      const key = analyticsCacheKey(filter);
      const cached = getState().analytics.cache[key];
      return !(cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS);
    },
  },
);

export const fetchAnalyticsOverviewForceThunk = createAsyncThunk<
  { key: string; overview: AnalyticsOverview; filter: AnalyticsPeriodParams },
  AnalyticsPeriodParams,
  { rejectValue: string }
>("analytics/fetchOverviewForce", async (params, { rejectWithValue }) => {
  try {
    const overview = await operationsApi.analytics.overview(params);
    return { key: analyticsCacheKey(params), overview, filter: params };
  } catch {
    return rejectWithValue("Failed to load analytics");
  }
});

const analyticsSlice = createSlice({
  name: "analytics",
  initialState,
  reducers: {
    setAnalyticsFilter(state, action: { payload: AnalyticsPeriodParams }) {
      state.filter = action.payload;
    },
    invalidateAnalytics(state) {
      state.cache = {};
      state.status = "idle";
    },
  },
  extraReducers: (builder) => {
    const handlePending = (state: AnalyticsState) => {
      state.status = "loading";
      state.error = null;
    };
    const handleFulfilled = (
      state: AnalyticsState,
      action: {
        payload: { key: string; overview: AnalyticsOverview; filter: AnalyticsPeriodParams };
      },
    ) => {
      state.status = "loaded";
      state.filter = action.payload.filter;
      state.cache[action.payload.key] = {
        overview: action.payload.overview,
        fetchedAt: Date.now(),
      };
    };
    const handleRejected = (state: AnalyticsState, action: { payload?: string }) => {
      state.status = "error";
      state.error = action.payload ?? "Failed to load analytics";
    };

    builder
      .addCase(fetchAnalyticsOverviewThunk.pending, handlePending)
      .addCase(fetchAnalyticsOverviewThunk.fulfilled, handleFulfilled)
      .addCase(fetchAnalyticsOverviewThunk.rejected, handleRejected)
      .addCase(fetchAnalyticsOverviewForceThunk.pending, handlePending)
      .addCase(fetchAnalyticsOverviewForceThunk.fulfilled, handleFulfilled)
      .addCase(fetchAnalyticsOverviewForceThunk.rejected, handleRejected)
      .addCase(logoutThunk.fulfilled, () => initialState)
      .addCase(sessionExpiredThunk.fulfilled, () => initialState);
  },
});

export const { setAnalyticsFilter, invalidateAnalytics } = analyticsSlice.actions;
export default analyticsSlice.reducer;

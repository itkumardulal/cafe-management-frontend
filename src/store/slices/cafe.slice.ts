"use client";

import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { getApiErrorMessage } from "@/src/lib/api-error";
import { api } from "@/src/services/api";
import { logoutThunk, sessionExpiredThunk } from "@/src/store/slices/auth.slice";
import type {
  CafeOverview,
  CafeState,
  CreateCafePayload,
  CreateCafeResult,
  ManagedCafe,
} from "@/src/store/types/cafe.types";
import type { CafeOverviewArg, FetchForceArg } from "@/src/store/types/fetch-args";
import {
  isOverviewForce,
  resolveOverviewCafeId,
} from "@/src/store/types/fetch-args";

const initialState: CafeState = {
  selectedCafeId: null,
  managedCafes: [],
  managedCafesStatus: "idle",
  selectedCafeOverview: null,
  overviewStatus: "idle",
  overviewLoadedCafeId: null,
  loading: false,
  error: null,
};

export const fetchManagedCafesThunk = createAsyncThunk<
  ManagedCafe[],
  FetchForceArg,
  { rejectValue: string; state: { cafe: CafeState } }
>("cafe/fetchManaged", async (_, { rejectWithValue }) => {
  try {
    const response = await api.get("/cafes/mine");
    return response.data.data as ManagedCafe[];
  } catch {
    return rejectWithValue("Failed to load cafes");
  }
}, {
  condition: (arg, { getState }) => {
    if (arg && typeof arg === "object" && arg.force) {
      return true;
    }
    const status = getState().cafe.managedCafesStatus;
    return status !== "loaded" && status !== "loading";
  },
});

export const fetchCafeOverviewThunk = createAsyncThunk<
  CafeOverview,
  CafeOverviewArg,
  { rejectValue: string; state: { cafe: CafeState } }
>("cafe/fetchOverview", async (arg, { rejectWithValue }) => {
  const cafeId = resolveOverviewCafeId(arg);
  try {
    const response = await api.get(`/cafes/${cafeId}/overview`);
    return response.data.data as CafeOverview;
  } catch {
    return rejectWithValue("Failed to load cafe overview");
  }
}, {
  condition: (arg, { getState }) => {
    if (isOverviewForce(arg)) {
      return true;
    }
    const cafeId = resolveOverviewCafeId(arg);
    const { overviewStatus, overviewLoadedCafeId } = getState().cafe;
    if (overviewStatus === "loading" && overviewLoadedCafeId === cafeId) {
      return false;
    }
    if (overviewStatus === "loaded" && overviewLoadedCafeId === cafeId) {
      return false;
    }
    return true;
  },
});

export const createCafeThunk = createAsyncThunk<
  CreateCafeResult,
  CreateCafePayload,
  { rejectValue: string }
>("cafe/createCafe", async (payload, { rejectWithValue }) => {
  try {
    const response = await api.post("/cafes", payload);
    return response.data.data as CreateCafeResult;
  } catch (error) {
    return rejectWithValue(getApiErrorMessage(error, "Failed to create cafe"));
  }
});

const cafeSlice = createSlice({
  name: "cafe",
  initialState,
  reducers: {
    setCafe(state, action: PayloadAction<string | null>) {
      const nextId = action.payload;
      if (state.selectedCafeId !== nextId) {
        state.selectedCafeOverview = null;
        state.overviewStatus = "idle";
        state.overviewLoadedCafeId = null;
      }
      state.selectedCafeId = nextId;
    },
    clearCafeError(state) {
      state.error = null;
    },
    invalidateManagedCafes(state) {
      state.managedCafesStatus = "idle";
    },
    invalidateCafeOverview(state) {
      state.overviewStatus = "idle";
      state.overviewLoadedCafeId = null;
      state.selectedCafeOverview = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchManagedCafesThunk.pending, (state) => {
        state.loading = true;
        state.managedCafesStatus = "loading";
        state.error = null;
      })
      .addCase(fetchManagedCafesThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.managedCafesStatus = "loaded";
        state.managedCafes = action.payload;
      })
      .addCase(fetchManagedCafesThunk.rejected, (state, action) => {
        state.loading = false;
        state.managedCafesStatus = "error";
        state.error = action.payload ?? "Failed to load cafes";
      })
      .addCase(fetchCafeOverviewThunk.pending, (state, action) => {
        state.loading = true;
        state.overviewStatus = "loading";
        state.error = null;
        state.overviewLoadedCafeId = resolveOverviewCafeId(action.meta.arg);
      })
      .addCase(fetchCafeOverviewThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.overviewStatus = "loaded";
        state.selectedCafeOverview = action.payload;
        state.selectedCafeId = action.payload.cafe.id;
        state.overviewLoadedCafeId = action.payload.cafe.id;
      })
      .addCase(fetchCafeOverviewThunk.rejected, (state, action) => {
        state.loading = false;
        state.overviewStatus = "error";
        state.error = action.payload ?? "Failed to load overview";
      })
      .addCase(createCafeThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCafeThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.managedCafesStatus = "loaded";
        const { cafe, cafeAdmin } = action.payload;
        const existing = state.managedCafes.find((c) => c.id === cafe.id);
        if (existing) {
          existing.users = [cafeAdmin, ...existing.users];
        } else {
          state.managedCafes = [{ ...cafe, users: [cafeAdmin] }, ...state.managedCafes];
        }
      })
      .addCase(createCafeThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to create cafe";
      })
      .addCase(logoutThunk.fulfilled, () => initialState)
      .addCase(sessionExpiredThunk.fulfilled, () => initialState);
  },
});

export const { setCafe, clearCafeError, invalidateManagedCafes, invalidateCafeOverview } =
  cafeSlice.actions;
export default cafeSlice.reducer;

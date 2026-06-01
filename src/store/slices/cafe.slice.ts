"use client";

import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { getApiErrorMessage } from "@/src/lib/api-error";
import { api } from "@/src/services/api";
import type {
  CafeOverview,
  CafeState,
  CreateCafePayload,
  CreateCafeResult,
  ManagedCafe,
} from "@/src/store/types/cafe.types";

const initialState: CafeState = {
  selectedCafeId: null,
  managedCafes: [],
  selectedCafeOverview: null,
  loading: false,
  error: null,
};

export const fetchManagedCafesThunk = createAsyncThunk<
  ManagedCafe[],
  void,
  { rejectValue: string }
>("cafe/fetchManaged", async (_, { rejectWithValue }) => {
  try {
    const response = await api.get("/cafes/mine");
    return response.data.data as ManagedCafe[];
  } catch {
    return rejectWithValue("Failed to load cafes");
  }
});

export const fetchCafeOverviewThunk = createAsyncThunk<
  CafeOverview,
  string,
  { rejectValue: string }
>("cafe/fetchOverview", async (cafeId, { rejectWithValue }) => {
  try {
    const response = await api.get(`/cafes/${cafeId}/overview`);
    return response.data.data as CafeOverview;
  } catch {
    return rejectWithValue("Failed to load cafe overview");
  }
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
      state.selectedCafeId = action.payload;
      if (!action.payload) {
        state.selectedCafeOverview = null;
      }
    },
    clearCafeError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchManagedCafesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchManagedCafesThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.managedCafes = action.payload;
      })
      .addCase(fetchManagedCafesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to load cafes";
      })
      .addCase(fetchCafeOverviewThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCafeOverviewThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedCafeOverview = action.payload;
        state.selectedCafeId = action.payload.cafe.id;
      })
      .addCase(fetchCafeOverviewThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to load overview";
      })
      .addCase(createCafeThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCafeThunk.fulfilled, (state, action) => {
        state.loading = false;
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
      });
  },
});

export const { setCafe, clearCafeError } = cafeSlice.actions;
export default cafeSlice.reducer;

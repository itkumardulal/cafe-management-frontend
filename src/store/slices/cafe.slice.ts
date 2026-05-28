"use client";

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api } from "../../services/api";

export interface ManagedCafeAdmin {
  id: string;
  staffId?: string | null;
  fullName: string;
  email: string;
  isActive: boolean;
  createdAt: string;
}

export interface ManagedCafe {
  id: string;
  cafeName: string;
  slug: string;
  email: string;
  contactNumber?: string | null;
  isActive: boolean;
  createdAt: string;
  users: ManagedCafeAdmin[];
}

export interface CafeOverview {
  cafe: {
    id: string;
    cafeName: string;
    slug: string;
    email: string;
    contactNumber?: string | null;
    isActive: boolean;
    createdAt: string;
    users: Array<{
      id: string;
      fullName: string;
      email: string;
      isActive: boolean;
    }>;
  };
  metrics: {
    totalStaff: number;
    activeStaff: number;
    totalUsers: number;
  };
}

export interface CreateCafePayload {
  cafeName: string;
  email: string;
  password: string;
  slug?: string;
  address?: string;
  contactNumber?: string;
  logo?: string;
}

type CafeState = {
  selectedCafeId: string | null;
  managedCafes: ManagedCafe[];
  selectedCafeOverview: CafeOverview | null;
  loading: boolean;
};

const initialState: CafeState = {
  selectedCafeId: null,
  managedCafes: [],
  selectedCafeOverview: null,
  loading: false,
};

export const fetchManagedCafesThunk = createAsyncThunk("cafe/fetchManaged", async () => {
  const response = await api.get("/cafes/mine");
  return response.data.data as ManagedCafe[];
});

export const fetchCafeOverviewThunk = createAsyncThunk(
  "cafe/fetchOverview",
  async (cafeId: string) => {
    const response = await api.get(`/cafes/${cafeId}/overview`);
    return response.data.data as CafeOverview;
  },
);

export const createCafeThunk = createAsyncThunk(
  "cafe/createCafe",
  async (payload: CreateCafePayload) => {
    const response = await api.post("/cafes", payload);
    return response.data.data as {
      cafe: ManagedCafe;
      cafeAdmin: ManagedCafeAdmin;
    };
  },
);

const cafeSlice = createSlice({
  name: "cafe",
  initialState,
  reducers: {
    setCafe(state, action: { payload: string | null }) {
      state.selectedCafeId = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchManagedCafesThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchManagedCafesThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.managedCafes = action.payload;
      })
      .addCase(fetchManagedCafesThunk.rejected, (state) => {
        state.loading = false;
      })
      .addCase(fetchCafeOverviewThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCafeOverviewThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedCafeOverview = action.payload;
      })
      .addCase(fetchCafeOverviewThunk.rejected, (state) => {
        state.loading = false;
      })
      .addCase(createCafeThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(createCafeThunk.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createCafeThunk.rejected, (state) => {
        state.loading = false;
      });
  },
});

export const { setCafe } = cafeSlice.actions;
export default cafeSlice.reducer;

"use client";

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api } from "../../services/api";

export interface StaffRecord {
  id: string;
  staffId: string;
  fullName: string;
  email: string;
  contactNumber?: string;
  isActive: boolean;
}

export interface CreatedUserRecord {
  id: string;
  staffId?: string | null;
  fullName: string;
  email: string;
  role: "CAFE_ADMIN" | "STAFF" | "SUPER_ADMIN";
  isActive: boolean;
  createdAt: string;
  cafe?: {
    id: string;
    cafeName: string;
    slug: string;
    isActive: boolean;
  } | null;
}

type UserState = {
  staff: StaffRecord[];
  createdUsers: CreatedUserRecord[];
  loading: boolean;
};

const initialState: UserState = {
  staff: [],
  createdUsers: [],
  loading: false,
};

export const fetchStaffThunk = createAsyncThunk("user/fetchStaff", async () => {
  const response = await api.get("/users/staff");
  return response.data.data.items as StaffRecord[];
});

export const createStaffThunk = createAsyncThunk(
  "user/createStaff",
  async (payload: {
    fullName: string;
    email: string;
    password: string;
    contactNumber?: string;
    accessMenuCodes?: string[];
  }) => {
    const response = await api.post("/users/staff", payload);
    return response.data.data as StaffRecord;
  },
);

export const fetchCreatedUsersThunk = createAsyncThunk("user/fetchCreatedUsers", async () => {
  const response = await api.get("/users/created-by-me");
  return response.data.data.items as CreatedUserRecord[];
});

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchStaffThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchStaffThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.staff = action.payload;
      })
      .addCase(fetchStaffThunk.rejected, (state) => {
        state.loading = false;
      })
      .addCase(createStaffThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(createStaffThunk.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createStaffThunk.rejected, (state) => {
        state.loading = false;
      })
      .addCase(fetchCreatedUsersThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCreatedUsersThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.createdUsers = action.payload;
      })
      .addCase(fetchCreatedUsersThunk.rejected, (state) => {
        state.loading = false;
      });
  },
});

export default userSlice.reducer;

"use client";

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { AuthUser } from "../../types/auth";
import { api } from "../../services/api";

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  initialized: boolean;
};

const initialState: AuthState = {
  user: null,
  loading: false,
  initialized: false,
};

export const loginThunk = createAsyncThunk(
  "auth/login",
  async (payload: { email: string; password: string; csrfToken: string }) => {
    const response = await api.post("/auth/login", payload);
    return response.data.data as AuthUser;
  },
);

export const meThunk = createAsyncThunk("auth/me", async () => {
  const response = await api.get("/auth/me");
  return response.data.data as AuthUser;
});

export const refreshSessionThunk = createAsyncThunk("auth/refresh", async () => {
  const response = await api.post("/auth/refresh");
  return response.data.data as AuthUser;
});

export const logoutThunk = createAsyncThunk("auth/logout", async () => {
  await api.post("/auth/logout");
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.initialized = true;
        state.user = action.payload;
      })
      .addCase(loginThunk.rejected, (state) => {
        state.loading = false;
      })
      .addCase(meThunk.fulfilled, (state, action) => {
        state.user = action.payload;
        state.initialized = true;
      })
      .addCase(meThunk.rejected, (state) => {
        state.user = null;
        state.initialized = true;
      })
      .addCase(refreshSessionThunk.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        state.user = null;
      });
  },
});

export default authSlice.reducer;

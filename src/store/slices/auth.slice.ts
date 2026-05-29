"use client";

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { AuthUser } from "@/src/types/auth";
import { api } from "@/src/services/api";
import type { AuthState, LoginPayload } from "@/src/store/types/auth.state";

const initialState: AuthState = {
  user: null,
  loading: false,
  initialized: false,
  error: null,
};

export const loginThunk = createAsyncThunk<AuthUser, LoginPayload, { rejectValue: string }>(
  "auth/login",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await api.post("/auth/login", payload);
      return response.data.data as AuthUser;
    } catch {
      return rejectWithValue("Login failed");
    }
  },
);

export const meThunk = createAsyncThunk<AuthUser, void, { rejectValue: string }>(
  "auth/me",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/auth/me");
      return response.data.data as AuthUser;
    } catch {
      return rejectWithValue("Session invalid");
    }
  },
);

export const refreshSessionThunk = createAsyncThunk<AuthUser, void, { rejectValue: string }>(
  "auth/refresh",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.post("/auth/refresh");
      return response.data.data as AuthUser;
    } catch {
      return rejectWithValue("Refresh failed");
    }
  },
);

export const logoutThunk = createAsyncThunk<void, void, { rejectValue: string }>(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await api.post("/auth/logout");
    } catch {
      return rejectWithValue("Logout failed");
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.initialized = true;
        state.user = action.payload;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Login failed";
      })
      .addCase(meThunk.fulfilled, (state, action) => {
        state.user = action.payload;
        state.initialized = true;
        state.error = null;
      })
      .addCase(meThunk.rejected, (state) => {
        state.user = null;
        state.initialized = true;
      })
      .addCase(refreshSessionThunk.fulfilled, (state, action) => {
        state.user = action.payload;
        state.error = null;
      })
      .addCase(refreshSessionThunk.rejected, (state) => {
        state.user = null;
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        state.user = null;
        state.error = null;
      });
  },
});

export const { clearAuthError } = authSlice.actions;
export default authSlice.reducer;

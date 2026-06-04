"use client";

import axios from "axios";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { AuthUser } from "@/src/types/auth";
import { api } from "@/src/services/api";
import type { AuthState, LoginPayload } from "@/src/store/types/auth.state";
import { authPublicApi } from "@/src/services/auth-public-api";

const initialState: AuthState = {
  user: null,
  loading: false,
  initialized: false,
  sessionExpired: false,
  error: null,
};

export type LoginRejectPayload = {
  message: string;
  status?: number;
  retryAfterSeconds?: number;
};

export const loginThunk = createAsyncThunk<
  AuthUser,
  LoginPayload,
  { rejectValue: LoginRejectPayload }
>(
  "auth/login",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await api.post("/auth/login", payload);
      return response.data.data as AuthUser;
    } catch (error) {
      if (!axios.isAxiosError(error)) {
        return rejectWithValue({ message: "Login failed" });
      }

      const messageRaw = error.response?.data?.message;
      const message =
        typeof messageRaw === "string"
          ? messageRaw
          : Array.isArray(messageRaw) && messageRaw.length > 0
            ? messageRaw.join(", ")
            : "Login failed";
      const retryAfterRaw = error.response?.headers?.["retry-after"];
      const retryAfterParsed =
        typeof retryAfterRaw === "string" ? Number.parseInt(retryAfterRaw, 10) : NaN;
      const retryAfterSeconds =
        Number.isFinite(retryAfterParsed) && retryAfterParsed > 0 ? retryAfterParsed : undefined;

      return rejectWithValue({
        message,
        status: error.response?.status,
        retryAfterSeconds,
      });
    }
  },
);

export const meThunk = createAsyncThunk<
  AuthUser,
  void,
  { rejectValue: string; state: { auth: AuthState } }
>(
  "auth/me",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/auth/me");
      return response.data.data as AuthUser;
    } catch {
      return rejectWithValue("Session invalid");
    }
  },
  {
    condition: (_, { getState }) => {
      const { initialized, loading } = getState().auth;
      return !initialized && !loading;
    },
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
      await authPublicApi.post("/auth/logout");
    } catch {
      return rejectWithValue("Logout failed");
    }
  },
);

export const sessionExpiredThunk = createAsyncThunk<void, void>(
  "auth/sessionExpired",
  async () => {
    try {
      await authPublicApi.post("/auth/logout");
    } catch {
      // Session already invalid — local cleanup still runs.
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
    clearSessionExpired(state) {
      state.sessionExpired = false;
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
        state.sessionExpired = false;
        state.user = action.payload;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message ?? "Login failed";
        state.user = null;
      })
      .addCase(meThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(meThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.initialized = true;
        state.error = null;
      })
      .addCase(meThunk.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.initialized = true;
      })
      .addCase(refreshSessionThunk.fulfilled, (state, action) => {
        state.user = action.payload;
        state.error = null;
      })
      .addCase(refreshSessionThunk.rejected, (state) => {
        state.user = null;
        state.initialized = true;
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        state.user = null;
        state.loading = false;
        state.initialized = true;
        state.error = null;
      })
      .addCase(sessionExpiredThunk.fulfilled, (state) => {
        state.user = null;
        state.loading = false;
        state.initialized = true;
        state.sessionExpired = true;
        state.error = null;
      });
  },
});

export const { clearAuthError, clearSessionExpired } = authSlice.actions;
export default authSlice.reducer;

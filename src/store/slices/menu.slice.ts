"use client";

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { MenuItem } from "@/src/types/auth";
import { api } from "@/src/services/api";
import type { MenuState } from "@/src/store/types/menu.state";

const initialState: MenuState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchAuthorizedMenusThunk = createAsyncThunk<
  MenuItem[],
  void,
  { rejectValue: string }
>("menu/fetchAuthorized", async (_, { rejectWithValue }) => {
  try {
    const response = await api.get("/menus/authorized");
    return response.data.data as MenuItem[];
  } catch {
    return rejectWithValue("Failed to load menus");
  }
});

const menuSlice = createSlice({
  name: "menu",
  initialState,
  reducers: {
    clearMenuError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAuthorizedMenusThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAuthorizedMenusThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchAuthorizedMenusThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to load menus";
        state.items = [];
      });
  },
});

export const { clearMenuError } = menuSlice.actions;
export default menuSlice.reducer;

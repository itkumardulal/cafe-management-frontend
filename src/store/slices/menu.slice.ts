"use client";

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { MenuItem } from "../../types/auth";
import { api } from "../../services/api";

type MenuState = {
  items: MenuItem[];
};

const initialState: MenuState = {
  items: [],
};

export const fetchAuthorizedMenusThunk = createAsyncThunk(
  "menu/fetchAuthorized",
  async () => {
    const response = await api.get("/menus/authorized");
    return response.data.data as MenuItem[];
  },
);

const menuSlice = createSlice({
  name: "menu",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchAuthorizedMenusThunk.fulfilled, (state, action) => {
      state.items = action.payload;
    });
  },
});

export default menuSlice.reducer;

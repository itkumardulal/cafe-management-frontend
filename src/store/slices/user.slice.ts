"use client";

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api } from "@/src/services/api";
import type {
  AssignableMenu,
  CreateStaffPayload,
  CreatedUserRecord,
  StaffRecord,
  UpdateStaffPayload,
  UserState,
} from "@/src/store/types/user.types";

const initialState: UserState = {
  staff: [],
  createdUsers: [],
  assignableMenus: [],
  loading: false,
  error: null,
};

export const fetchStaffThunk = createAsyncThunk<StaffRecord[], void, { rejectValue: string }>(
  "user/fetchStaff",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/users/staff");
      return response.data.data.items as StaffRecord[];
    } catch {
      return rejectWithValue("Failed to load staff");
    }
  },
);

export const createStaffThunk = createAsyncThunk<
  StaffRecord,
  CreateStaffPayload,
  { rejectValue: string }
>("user/createStaff", async (payload, { rejectWithValue }) => {
  try {
    const response = await api.post("/users/staff", payload);
    return response.data.data as StaffRecord;
  } catch {
    return rejectWithValue("Failed to create staff");
  }
});

export const fetchCreatedUsersThunk = createAsyncThunk<
  CreatedUserRecord[],
  void,
  { rejectValue: string }
>("user/fetchCreatedUsers", async (_, { rejectWithValue }) => {
  try {
    const response = await api.get("/users/created-by-me");
    return response.data.data.items as CreatedUserRecord[];
  } catch {
    return rejectWithValue("Failed to load created users");
  }
});

export const fetchAssignableMenusThunk = createAsyncThunk<
  AssignableMenu[],
  void,
  { rejectValue: string }
>("user/fetchAssignableMenus", async (_, { rejectWithValue }) => {
  try {
    const response = await api.get("/menus/assignable");
    return response.data.data as AssignableMenu[];
  } catch {
    return rejectWithValue("Failed to load assignable menus");
  }
});

export const updateStaffThunk = createAsyncThunk<
  string,
  UpdateStaffPayload,
  { rejectValue: string }
>("user/updateStaff", async (payload, { rejectWithValue }) => {
  try {
    const { id, accessMenuCodes, ...rest } = payload;
    if (Object.keys(rest).length > 0) {
      await api.patch(`/users/staff/${id}`, rest);
    }
    if (accessMenuCodes) {
      await api.post(`/users/staff/${id}/menu-access`, { menuCodes: accessMenuCodes });
    }
    return id;
  } catch {
    return rejectWithValue("Failed to update staff");
  }
});

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    clearUserError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStaffThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStaffThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.staff = action.payload;
      })
      .addCase(fetchStaffThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to load staff";
      })
      .addCase(createStaffThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createStaffThunk.fulfilled, (state, action) => {
        state.loading = false;
        const exists = state.staff.some((s) => s.id === action.payload.id);
        if (!exists) {
          state.staff = [action.payload, ...state.staff];
        }
      })
      .addCase(createStaffThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to create staff";
      })
      .addCase(fetchCreatedUsersThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCreatedUsersThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.createdUsers = action.payload;
      })
      .addCase(fetchCreatedUsersThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to load created users";
      })
      .addCase(fetchAssignableMenusThunk.fulfilled, (state, action) => {
        state.assignableMenus = action.payload;
      })
      .addCase(fetchAssignableMenusThunk.rejected, (state, action) => {
        state.error = action.payload ?? "Failed to load menus";
      })
      .addCase(updateStaffThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateStaffThunk.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateStaffThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to update staff";
      });
  },
});

export const { clearUserError } = userSlice.actions;
export default userSlice.reducer;

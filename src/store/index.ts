import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/auth.slice";
import userReducer from "./slices/user.slice";
import menuReducer from "./slices/menu.slice";
import cafeReducer from "./slices/cafe.slice";
import dashboardReducer from "./slices/dashboard.slice";
import referenceDataReducer from "./slices/reference-data.slice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    menu: menuReducer,
    cafe: cafeReducer,
    dashboard: dashboardReducer,
    referenceData: referenceDataReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export type {
  StaffRecord,
  AssignableMenu,
  CreatedUserRecord,
  CreateStaffPayload,
  UpdateStaffPayload,
  UserState,
  ManagedCafe,
  ManagedCafeAdmin,
  CafeOverview,
  CreateCafePayload,
  CafeState,
  AuthState,
  MenuState,
  DashboardState,
  ReferenceDataState,
  SellableCatalogItem,
} from "./types";

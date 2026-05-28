import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/auth.slice";
import userReducer from "./slices/user.slice";
import menuReducer from "./slices/menu.slice";
import cafeReducer from "./slices/cafe.slice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    menu: menuReducer,
    cafe: cafeReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

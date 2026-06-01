"use client";

import { Provider } from "react-redux";
import { ResponsiveToaster } from "./responsive-toaster";
import { store } from "../../store";
import { ThemeProvider } from "./theme-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <Provider store={store}>
        {children}
        <ResponsiveToaster />
      </Provider>
    </ThemeProvider>
  );
}

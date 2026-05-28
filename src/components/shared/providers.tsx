"use client";

import { Provider } from "react-redux";
import { Toaster } from "sonner";
import { store } from "../../store";
import { ThemeProvider } from "./theme-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <Provider store={store}>
        {children}
        <Toaster richColors position="top-center" closeButton />
      </Provider>
    </ThemeProvider>
  );
}

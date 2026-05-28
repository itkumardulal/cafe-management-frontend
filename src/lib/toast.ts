"use client";

import { toast } from "sonner";

export const appToast = {
  success: (message: string) => toast.success(message),
  error: (message: string) => toast.error(message),
  warning: (message: string) => toast.warning(message),
  loading: (message: string) => toast.loading(message),
  promise: <T,>(
    promise: Promise<T>,
    messages: { loading: string; success: string; error: string },
  ) => toast.promise(promise, messages),
};

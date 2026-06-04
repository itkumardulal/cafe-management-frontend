import axios from "axios";
import type { AxiosRequestConfig } from "axios";
import { AxiosHeaders } from "axios";

const readCookie = (name: string): string | null => {
  if (typeof document === "undefined") {
    return null;
  }
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${name.replace(/[-[\]/{}()*+?.\\^$|]/g, "\\$&")}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : null;
};

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api",
  withCredentials: true,
});

let refreshingPromise: Promise<unknown> | null = null;

/** Do not treat credential/auth bootstrap 401s as an expired access token. */
const skipRefreshRetry = (url: string | undefined) => {
  if (!url) return false;
  const paths = [
    "/auth/login",
    "/auth/refresh",
    "/auth/logout",
    "/auth/activate-account",
    "/auth/forgot-password",
    "/auth/verify-otp",
    "/auth/resend-otp",
    "/auth/reset-password",
    "/auth/invitation/",
  ];
  return paths.some((path) => url.includes(path));
};

api.interceptors.request.use((config) => {
  const method = (config.method ?? "get").toLowerCase();
  if (!["get", "head", "options"].includes(method)) {
    const csrfToken = readCookie(
      process.env.NEXT_PUBLIC_CSRF_COOKIE_NAME ?? "csrf_token",
    );
    if (csrfToken) {
      const headerName =
        process.env.NEXT_PUBLIC_CSRF_HEADER_NAME ?? "x-csrf-token";
      const headers = AxiosHeaders.from(config.headers);
      headers.set(headerName, csrfToken);
      config.headers = headers;
    }
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };
    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      skipRefreshRetry(originalRequest.url)
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    if (!refreshingPromise) {
      refreshingPromise = (async () => {
        const { store } = await import("@/src/store");
        const { refreshSessionThunk } = await import(
          "@/src/store/slices/auth.slice"
        );
        return store.dispatch(refreshSessionThunk());
      })().finally(() => {
        refreshingPromise = null;
      });
    }
    try {
      await refreshingPromise;
      return api(originalRequest as AxiosRequestConfig);
    } catch {
      const { redirectToHomeAfterSessionExpired } = await import(
        "@/src/lib/session-auth"
      );
      await redirectToHomeAfterSessionExpired(
        "Your session has expired. Please sign in again.",
      );
      return Promise.reject(error);
    }
  },
);

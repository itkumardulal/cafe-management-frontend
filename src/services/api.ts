import axios from "axios";
import type { AxiosRequestConfig } from "axios";
import { AxiosHeaders } from "axios";
import { getCsrfHeaderName, readCsrfToken } from "@/src/lib/csrf-client";
import {
  isRecoverableRefreshFailure,
  SessionRefreshError,
} from "@/src/lib/session-errors";
import { refreshSessionWithRetry } from "@/src/lib/session-refresh-coordinator";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api",
  withCredentials: true,
  timeout: Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS ?? 30_000),
});

let refreshingPromise: Promise<void> | null = null;

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

async function ensureSessionRefreshed(): Promise<void> {
  if (!refreshingPromise) {
    refreshingPromise = refreshSessionWithRetry(async () => {
      const { store } = await import("@/src/store");
      const { refreshSessionThunk } = await import("@/src/store/slices/auth.slice");
      const result = await store.dispatch(refreshSessionThunk());
      if (refreshSessionThunk.rejected.match(result)) {
        const payload = result.payload ?? { message: "Refresh failed" };
        throw new SessionRefreshError(payload);
      }
    }).finally(() => {
      refreshingPromise = null;
    });
  }
  await refreshingPromise;
}

api.interceptors.request.use((config) => {
  const method = (config.method ?? "get").toLowerCase();
  if (!["get", "head", "options"].includes(method)) {
    const csrfToken = readCsrfToken();
    if (csrfToken) {
      const headers = AxiosHeaders.from(config.headers);
      headers.set(getCsrfHeaderName(), csrfToken);
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
    try {
      await ensureSessionRefreshed();
      return api(originalRequest as AxiosRequestConfig);
    } catch (refreshError) {
      if (isRecoverableRefreshFailure(refreshError)) {
        return Promise.reject(error);
      }

      const { store } = await import("@/src/store");
      const { initialized } = store.getState().auth;
      if (!initialized) {
        return Promise.reject(error);
      }

      const { redirectToHomeAfterSessionExpired } = await import(
        "@/src/lib/session-auth"
      );
      const { ACCOUNT_DEACTIVATED_MESSAGE } = await import("@/src/lib/auth-messages");
      const { getApiErrorMessage } = await import("@/src/lib/api-error");
      const refreshMessage = getApiErrorMessage(refreshError, "");
      const sessionMessage =
        refreshMessage === ACCOUNT_DEACTIVATED_MESSAGE
          ? ACCOUNT_DEACTIVATED_MESSAGE
          : "Your session has expired. Please sign in again.";
      await redirectToHomeAfterSessionExpired(sessionMessage);
      return Promise.reject(error);
    }
  },
);

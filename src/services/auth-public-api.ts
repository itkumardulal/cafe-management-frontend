import axios from "axios";
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

export const authPublicApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api",
  withCredentials: true,
});

authPublicApi.interceptors.request.use((config) => {
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

export type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

export const unwrapData = <T>(response: { data: ApiEnvelope<T> }) =>
  response.data.data;

/** Clears auth cookies so a new login is not mixed with an old refresh session. */
export async function clearAuthSession() {
  try {
    await authPublicApi.post("/auth/logout");
  } catch {
    // No active session — safe to ignore
  }
}

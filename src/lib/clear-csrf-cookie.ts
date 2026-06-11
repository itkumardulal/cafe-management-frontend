import { getCsrfCookieName } from "@/src/lib/csrf-client";

/** Clears a stale CSRF cookie before unauthenticated auth flows (e.g. login). */
export function clearCsrfCookie() {
  if (typeof document === "undefined") {
    return;
  }
  const name = getCsrfCookieName();
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}

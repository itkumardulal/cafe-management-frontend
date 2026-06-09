/** Clears a stale CSRF cookie before unauthenticated auth flows (e.g. login). */
export function clearCsrfCookie() {
  if (typeof document === "undefined") {
    return;
  }
  const name = process.env.NEXT_PUBLIC_CSRF_COOKIE_NAME ?? "csrf_token";
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}

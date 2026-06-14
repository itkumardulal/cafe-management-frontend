const PUBLIC_AUTH_PATHS = new Set([
  "/login",
  "/forgot-password",
  "/verify-otp",
  "/reset-password",
  "/activate-account",
  "/change-password-first",
]);

/** Validates a post-login redirect target from middleware `next` query param. */
export function safeRedirectPath(next: string | null | undefined): string | null {
  if (!next) {
    return null;
  }
  const trimmed = next.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return null;
  }
  const pathOnly = trimmed.split("?")[0]?.split("#")[0] ?? trimmed;
  if (PUBLIC_AUTH_PATHS.has(pathOnly)) {
    return null;
  }
  return trimmed;
}

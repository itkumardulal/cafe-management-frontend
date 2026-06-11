const readCookie = (name: string): string | null => {
  if (typeof document === "undefined") {
    return null;
  }
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${name.replace(/[-[\]/{}()*+?.\\^$|]/g, "\\$&")}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : null;
};

export function getCsrfCookieName(): string {
  return process.env.NEXT_PUBLIC_CSRF_COOKIE_NAME ?? "csrf_token";
}

export function getCsrfHeaderName(): string {
  return process.env.NEXT_PUBLIC_CSRF_HEADER_NAME ?? "x-csrf-token";
}

/** Reads the double-submit CSRF cookie (must NOT be the HttpOnly access-token cookie). */
export function readCsrfToken(): string | null {
  const cookieName = getCsrfCookieName();
  const authCookieName =
    process.env.NEXT_PUBLIC_AUTH_COOKIE_NAME ?? "cms_access_token";

  if (
    process.env.NODE_ENV === "development" &&
    cookieName === authCookieName
  ) {
    console.error(
      `[csrf] NEXT_PUBLIC_CSRF_COOKIE_NAME must not be "${authCookieName}" — use "csrf_token".`,
    );
    return null;
  }

  return readCookie(cookieName);
}

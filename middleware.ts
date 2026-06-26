import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { safeRedirectPath } from "@/src/lib/safe-redirect-path";

const AUTH_COOKIE_NAME =
  process.env.NEXT_PUBLIC_AUTH_COOKIE_NAME ?? "cms_access_token";
const REFRESH_COOKIE_NAME =
  process.env.NEXT_PUBLIC_REFRESH_COOKIE_NAME ?? "cms_refresh_token";

const PUBLIC_PATHS = [
  "/login",
  "/forgot-password",
  "/verify-otp",
  "/reset-password",
  "/activate-account",
  "/change-password-first",
];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) {
    return true;
  }
  if (pathname.startsWith("/menu/")) {
    return true;
  }
  return false;
}

function hasAuthCookies(request: NextRequest): boolean {
  const accessToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;
  return Boolean(accessToken || refreshToken);
}

function postLoginDestination(request: NextRequest): string {
  const next = safeRedirectPath(request.nextUrl.searchParams.get("next"));
  return next ?? "/dashboard";
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/socket.io") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const authenticated = hasAuthCookies(request);

  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(authenticated ? "/dashboard" : "/login", request.url),
    );
  }

  if (pathname === "/login") {
    const activated = request.nextUrl.searchParams.get("activated") === "1";
    const expired = request.nextUrl.searchParams.get("expired") === "1";
    if (authenticated && !activated && !expired) {
      return NextResponse.redirect(new URL(postLoginDestination(request), request.url));
    }
    return NextResponse.next();
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (!authenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/table-orders/waiting-settlement") {
    return NextResponse.redirect(
      new URL("/table-orders?view=waiting-bills", request.url),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

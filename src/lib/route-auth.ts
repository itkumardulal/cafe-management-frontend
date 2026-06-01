/**
 * Path authorization for dashboard routes (mirrors /menus/authorized from API).
 */

export function normalizePathname(pathname: string): string {
  if (!pathname || pathname === "/") {
    return "/";
  }
  const withoutTrailing = pathname.replace(/\/+$/, "");
  return withoutTrailing || "/";
}

export function isPathAllowed(pathname: string, allowedRoutes: string[]): boolean {
  const path = normalizePathname(pathname);
  const routes = allowedRoutes.map(normalizePathname);

  if (routes.some((route) => route === path)) {
    return true;
  }

  if (
    path === "/dashboard" &&
    routes.some((route) => route === "/dashboard" || route.startsWith("/dashboard/"))
  ) {
    return true;
  }

  return routes.some(
    (route) => route !== "/" && (path === route || path.startsWith(`${route}/`)),
  );
}

export function firstAllowedRoute(allowedRoutes: string[]): string {
  const sorted = [...allowedRoutes].sort((a, b) => a.localeCompare(b));
  return sorted[0] ?? "/dashboard";
}

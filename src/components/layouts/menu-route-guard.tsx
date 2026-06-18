"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { NotAuthorized } from "@/src/components/shared/not-authorized";
import { firstAllowedRoute, isPathAllowed, normalizePathname } from "@/src/lib/route-auth";
import { fetchAuthorizedMenusThunk } from "@/src/store/slices/menu.slice";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";

export function MenuRouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { items: menus, loading, error, initialized: menusInitialized } = useAppSelector(
    (state) => state.menu,
  );
  const initialized = useAppSelector((state) => state.auth.initialized);
  const user = useAppSelector((state) => state.auth.user);

  const allowedRoutes = menus.map((menu) => menu.route);
  const canCheckAccess = Boolean(
    user && menusInitialized && !(error && menus.length === 0),
  );
  const pathAllowed = canCheckAccess ? isPathAllowed(pathname, allowedRoutes) : true;
  const isDashboardPath = normalizePathname(pathname) === "/dashboard";
  const dashboardAccessDenied = canCheckAccess && !pathAllowed && isDashboardPath;
  const fallback =
    canCheckAccess && !pathAllowed && !isDashboardPath
      ? firstAllowedRoute(allowedRoutes)
      : null;
  const shouldRedirect = Boolean(fallback && fallback !== pathname);

  useEffect(() => {
    if (initialized && user && !menusInitialized && !loading) {
      void dispatch(fetchAuthorizedMenusThunk());
    }
  }, [dispatch, initialized, user, menusInitialized, loading]);

  useEffect(() => {
    if (!shouldRedirect || !fallback) {
      return;
    }
    router.replace(fallback);
  }, [shouldRedirect, fallback, router]);

  if (!user) {
    return null;
  }

  if (!menusInitialized || loading) {
    return (
      <div className="flex min-h-[12rem] items-center justify-center">
        <p className="text-sm text-[var(--color-muted)]">Loading navigation...</p>
      </div>
    );
  }

  if (error && menus.length === 0) {
    return (
      <NotAuthorized description="Could not verify your access to this page. Try signing in again." />
    );
  }

  if (!pathAllowed) {
    if (dashboardAccessDenied) {
      return (
        <NotAuthorized description="You do not have access to the dashboard." />
      );
    }

    if (shouldRedirect) {
      return (
        <div className="flex min-h-[12rem] items-center justify-center">
          <p className="text-sm text-[var(--color-muted)]">Redirecting...</p>
        </div>
      );
    }

    return (
      <NotAuthorized description="You do not have permission to view this page." />
    );
  }

  return <>{children}</>;
}

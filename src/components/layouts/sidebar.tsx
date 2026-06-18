"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, LayoutDashboard, LogOut } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Modal } from "@/src/components/ui/modal";
import { cn } from "@/src/lib/cn";
import { canAccessDashboard } from "@/src/lib/dashboard-access";
import { canAccessStockAlerts } from "@/src/lib/stock-alerts-access";
import { logoutThunk } from "@/src/store/slices/auth.slice";
import { fetchStockAlertsThunk } from "@/src/store/slices/dashboard.slice";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { SidebarNavGroups } from "./sidebar-nav-groups";

type SidebarProps = {
  collapsed?: boolean;
  onToggle?: () => void;
  className?: string;
};

export function Sidebar({ collapsed = false, onToggle, className }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const menus = useAppSelector((state) => state.menu.items);
  const menusInitialized = useAppSelector((state) => state.menu.initialized);
  const stockAlerts = useAppSelector((state) => state.dashboard.stockAlerts);
  const stockAlertsStatus = useAppSelector((state) => state.dashboard.stockAlertsStatus);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const stockAlertCount = useMemo(() => {
    if (!user?.role || user.role === "SUPER_ADMIN" || !stockAlerts) {
      return 0;
    }
    return stockAlerts.counts.low + stockAlerts.counts.out;
  }, [stockAlerts, user?.role]);

  const canFetchStockAlerts = useMemo(
    () => canAccessStockAlerts(user?.role, menus),
    [menus, user?.role],
  );

  const showDashboardLink = useMemo(() => {
    if (!user?.role) {
      return false;
    }
    if (user.role === "STAFF" && !menusInitialized) {
      return false;
    }
    return canAccessDashboard(user.role, menus);
  }, [menus, menusInitialized, user?.role]);

  const showDashboardDenied = useMemo(() => {
    if (!user?.role) {
      return false;
    }
    if (user.role === "STAFF" && !menusInitialized) {
      return false;
    }
    return !canAccessDashboard(user.role, menus);
  }, [menus, menusInitialized, user?.role]);

  const dashboardActive = pathname === "/dashboard";

  useEffect(() => {
    if (!user?.role || user.role === "SUPER_ADMIN") {
      return;
    }
    if (user.role === "STAFF" && !menusInitialized) {
      return;
    }
    if (!canFetchStockAlerts) {
      return;
    }
    if (stockAlertsStatus !== "idle") {
      return;
    }
    void dispatch(fetchStockAlertsThunk());
  }, [
    canFetchStockAlerts,
    dispatch,
    menusInitialized,
    stockAlertsStatus,
    user?.role,
  ]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await dispatch(logoutThunk());
      setLogoutConfirmOpen(false);
      router.replace("/login");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <>
    <aside
      className={cn(
        "flex h-full max-h-full min-h-0 shrink-0 flex-col overflow-hidden border-r border-[var(--color-border)] bg-[var(--color-surface)] p-3 transition-all duration-300",
        collapsed ? "w-[84px]" : "w-64",
        className,
      )}
    >
      <div className="mb-3 flex shrink-0 items-center justify-between gap-2 px-2 pt-2">
        {showDashboardLink ? (
          <Link
            href="/dashboard"
            className={cn(
              "sidebar-nav-link touch-target min-w-0 flex-1",
              collapsed ? "min-h-11 justify-center px-3 py-2.5" : "px-2 py-2",
              dashboardActive && "sidebar-nav-link-active",
              dashboardActive &&
                collapsed &&
                "ring-1 ring-[color-mix(in_srgb,var(--color-primary)_22%,transparent)]",
            )}
            title="Dashboard"
            aria-current={dashboardActive ? "page" : undefined}
          >
            <LayoutDashboard size={16} className="sidebar-nav-icon shrink-0 opacity-70" aria-hidden />
            {!collapsed ? (
              <span className="truncate text-sm font-semibold">Dashboard</span>
            ) : null}
          </Link>
        ) : showDashboardDenied ? (
          <Card
            density="compact"
            title={collapsed ? "You cannot view the dashboard." : undefined}
            className={cn(
              "min-w-0 flex-1 border-[var(--color-border)] bg-[var(--color-surface-muted)]/50 shadow-none",
              collapsed ? "flex min-h-11 items-center justify-center px-2 py-2" : "px-2.5 py-2",
            )}
          >
            {collapsed ? (
              <>
                <LayoutDashboard
                  size={16}
                  className="shrink-0 text-[var(--color-muted)] opacity-50"
                  aria-hidden
                />
                <span className="sr-only">You cannot view the dashboard.</span>
              </>
            ) : (
              <p className="text-xs leading-snug text-[var(--color-muted)]">
                You cannot view the dashboard.
              </p>
            )}
          </Card>
        ) : (
          <div className="flex-1" aria-hidden />
        )}
        {onToggle ? (
          <button
            type="button"
            onClick={onToggle}
            className="hidden shrink-0 rounded-lg p-1.5 text-[var(--color-nav-idle)] hover:bg-[var(--color-cream-100)] hover:text-[var(--color-nav-idle-hover)] lg:block"
            aria-label="Toggle sidebar"
          >
            <ChevronLeft
              size={16}
              className={`transition-transform ${collapsed ? "rotate-180" : ""}`}
            />
          </button>
        ) : null}
      </div>

      <nav
        className="sidebar-nav-scroll min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain"
        aria-label="Main navigation"
      >
        <SidebarNavGroups
          menus={menus}
          pathname={pathname}
          collapsed={collapsed}
          stockAlertCount={stockAlertCount}
        />
      </nav>

      <div className="mt-auto shrink-0 border-t border-[var(--color-border)] bg-[var(--color-surface)] pt-3">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          fullWidth={!collapsed}
          loading={loggingOut}
          onClick={() => setLogoutConfirmOpen(true)}
          aria-label="Logout"
          className={collapsed ? "w-full justify-center px-0" : ""}
        >
          <LogOut size={14} />
          {!collapsed ? <span className="ml-1">Logout</span> : null}
        </Button>
      </div>
    </aside>

    <Modal
      open={logoutConfirmOpen}
      title="Sign out"
      description="You will need to sign in again to access your account."
      onClose={() => {
        if (!loggingOut) {
          setLogoutConfirmOpen(false);
        }
      }}
      size="md"
    >
      <Card density="comfortable" className="border-0 bg-[var(--color-cream-50)] shadow-none">
        <p className="text-sm text-[var(--color-foreground)]">
          Do you want to logout?
        </p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setLogoutConfirmOpen(false)}
            disabled={loggingOut}
          >
            Cancel
          </Button>
          <Button
            type="button"
            loading={loggingOut}
            onClick={() => void handleLogout()}
          >
            Yes, logout
          </Button>
        </div>
      </Card>
    </Modal>
    </>
  );
}

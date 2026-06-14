"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, Coffee, LogOut } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Modal } from "@/src/components/ui/modal";
import { cn } from "@/src/lib/cn";
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
        <div className="flex min-w-0 items-center gap-2 overflow-hidden">
          <div className="shrink-0 rounded-lg bg-[var(--color-primary-soft)] p-2 text-[var(--color-primary)]">
            <Coffee size={16} />
          </div>
          {!collapsed ? (
            <h2 className="truncate text-base font-semibold text-[var(--color-foreground)]">
              Cafe System
            </h2>
          ) : null}
        </div>
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

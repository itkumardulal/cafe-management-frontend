"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronLeft, Coffee, LogOut } from "lucide-react";
import { getMenuIcon } from "@/src/lib/menu-icons";
import { motion } from "framer-motion";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Modal } from "@/src/components/ui/modal";
import { cn } from "@/src/lib/cn";
import { logoutThunk } from "@/src/store/slices/auth.slice";
import { useAppDispatch, useAppSelector } from "../../store/hooks";

type SidebarProps = {
  collapsed?: boolean;
  onToggle?: () => void;
  className?: string;
};

export function Sidebar({ collapsed = false, onToggle, className }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const menus = useAppSelector((state) => state.menu.items);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

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
        className="sidebar-nav-scroll min-h-0 flex-1 space-y-1.5 overflow-x-hidden overflow-y-auto overscroll-contain"
        aria-label="Main navigation"
      >
        {menus.map((menu) => {
          const active = pathname === menu.route;
          const Icon = getMenuIcon(menu.icon);
          return (
            <motion.div key={menu.id} whileHover={{ x: 2 }}>
              <Link
                href={menu.route}
                className={`touch-target flex min-h-11 items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition ${
                  active
                    ? "bg-[var(--color-primary-soft)] font-semibold text-[var(--color-nav-active-text)] shadow-[inset_3px_0_0_0_var(--color-primary)]"
                    : "text-[var(--color-nav-idle)] hover:bg-[var(--color-cream-100)] hover:text-[var(--color-nav-idle-hover)]"
                }`}
                title={collapsed ? menu.name : undefined}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={16} className="shrink-0" aria-hidden />
                {!collapsed ? <span className="truncate">{menu.name}</span> : null}
              </Link>
            </motion.div>
          );
        })}
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

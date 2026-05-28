"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronLeft, Coffee, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/cn";
import { logoutThunk } from "@/src/store/slices/auth.slice";
import { fetchAuthorizedMenusThunk } from "../../store/slices/menu.slice";
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

  useEffect(() => {
    void dispatch(fetchAuthorizedMenusThunk());
  }, [dispatch]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await dispatch(logoutThunk());
    } finally {
      setLoggingOut(false);
      router.replace("/login");
    }
  };

  return (
    <aside
      className={cn(
        "h-full shrink-0 border-r border-[var(--color-border)] bg-[var(--color-surface)] p-3 transition-all duration-300",
        collapsed ? "w-[84px]" : "w-64",
        className,
      )}
    >
      <div className="mb-4 flex items-center justify-between gap-2 px-2 pt-2">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="rounded-lg bg-[var(--color-primary-soft)] p-2 text-[var(--color-primary)]">
            <Coffee size={16} />
          </div>
          {!collapsed ? (
            <h2 className="text-base font-semibold text-[var(--color-foreground)]">Cafe System</h2>
          ) : null}
        </div>
        {onToggle ? (
          <button
            type="button"
            onClick={onToggle}
            className="hidden rounded-lg p-1.5 text-[var(--color-muted)] hover:bg-[var(--color-cream-100)] lg:block"
            aria-label="Toggle sidebar"
          >
            <ChevronLeft
              size={16}
              className={`transition-transform ${collapsed ? "rotate-180" : ""}`}
            />
          </button>
        ) : null}
      </div>
      <div className="flex h-[calc(100%-3.5rem)] flex-col">
        <nav className="space-y-1.5">
          {menus.map((menu) => {
            const active = pathname === menu.route;
            return (
              <motion.div key={menu.id} whileHover={{ x: 2 }}>
                <Link
                  href={menu.route}
                  className={`touch-target flex items-center rounded-lg px-3 text-sm transition ${
                    active
                      ? "bg-[var(--color-primary-soft)] font-medium text-[var(--color-primary)]"
                      : "text-[var(--color-muted)] hover:bg-[var(--color-cream-100)] hover:text-[var(--color-foreground)]"
                  }`}
                  title={collapsed ? menu.name : undefined}
                  aria-current={active ? "page" : undefined}
                >
                  <span className={`${collapsed ? "sr-only" : ""}`}>{menu.name}</span>
                  {collapsed ? (
                    <span className="mx-auto rounded-md bg-[var(--color-cream-100)] px-1.5 py-0.5 text-[11px] font-semibold tracking-wide text-[var(--color-foreground)]">
                      {menu.name.slice(0, 2)}
                    </span>
                  ) : null}
                </Link>
              </motion.div>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-(--color-border) pt-3">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            fullWidth={!collapsed}
            loading={loggingOut}
            onClick={() => void handleLogout()}
            aria-label="Logout"
            className={collapsed ? "w-full justify-center px-0" : ""}
          >
            <LogOut size={14} />
            {!collapsed ? <span className="ml-1">Logout</span> : null}
          </Button>
        </div>
      </div>
    </aside>
  );
}

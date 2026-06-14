"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { AuthGuard } from "@/src/components/layouts/auth-guard";
import { Header } from "@/src/components/layouts/header";
import { MenuRouteGuard } from "@/src/components/layouts/menu-route-guard";
import { Sidebar } from "@/src/components/layouts/sidebar";
import { useProactiveSessionRefresh } from "@/src/hooks/use-proactive-session-refresh";

const MobileNav = dynamic(() => import("@/src/components/layouts/mobile-nav").then((mod) => mod.MobileNav), {
  ssr: false,
});

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);
  useProactiveSessionRefresh();

  return (
    <AuthGuard>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-[var(--color-surface)] focus:px-4 focus:py-2 focus:shadow-[var(--shadow-md)]"
      >
        Skip to content
      </a>
      <div className="flex h-dvh flex-col overflow-hidden bg-[var(--color-background)]">
        <Header
          mobileNavOpen={mobileNavOpen}
          onOpenMobileNav={() => setMobileNavOpen(true)}
        />
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <Sidebar
            collapsed={collapsed}
            onToggle={() => setCollapsed((prev) => !prev)}
            className="hidden lg:flex"
          />
          <MobileNav open={mobileNavOpen} onClose={closeMobileNav} />
          <main
            id="main-content"
            className="min-h-0 min-w-0 flex-1 overflow-x-auto overflow-y-auto p-4 sm:p-6"
          >
            <MenuRouteGuard>{children}</MenuRouteGuard>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}

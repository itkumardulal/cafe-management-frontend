"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { AuthGuard } from "@/src/components/layouts/auth-guard";
import { Header } from "@/src/components/layouts/header";
import { Sidebar } from "@/src/components/layouts/sidebar";

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

  return (
    <AuthGuard>
      <div className="flex h-dvh flex-col overflow-hidden bg-[var(--color-background)]">
        <Header onOpenMobileNav={() => setMobileNavOpen(true)} />
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <Sidebar
            collapsed={collapsed}
            onToggle={() => setCollapsed((prev) => !prev)}
            className="hidden lg:flex"
          />
          <MobileNav open={mobileNavOpen} onClose={closeMobileNav} />
          <main className="min-h-0 min-w-0 flex-1 overflow-x-auto overflow-y-auto p-4 pb-24 sm:p-6">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}

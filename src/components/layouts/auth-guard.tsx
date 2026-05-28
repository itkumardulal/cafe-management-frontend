"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SidebarSkeleton } from "@/src/components/skeletons/sidebar-skeleton";
import { meThunk } from "../../store/slices/auth.slice";
import { useAppDispatch, useAppSelector } from "../../store/hooks";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, initialized } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!initialized) {
      void dispatch(meThunk());
    }
  }, [dispatch, initialized]);

  useEffect(() => {
    if (initialized && !user) {
      router.replace("/login");
    }
  }, [initialized, router, user]);

  if (!initialized) {
    return (
      <div className="grid min-h-screen grid-cols-1 bg-[var(--color-background)] lg:grid-cols-[280px_1fr]">
        <div className="hidden border-r border-[var(--color-border)] bg-[var(--color-surface)] lg:block">
          <SidebarSkeleton />
        </div>
        <div className="p-6">
          <p className="text-sm text-[var(--color-muted)]">Loading session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}

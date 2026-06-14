"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SidebarSkeleton } from "@/src/components/skeletons/sidebar-skeleton";
import { bootstrapSessionThunk } from "../../store/slices/auth.slice";
import { isRecoverableRefreshPayload } from "@/src/lib/session-errors";
import { useAppDispatch, useAppSelector } from "../../store/hooks";

const BOOTSTRAP_RETRY_MS = 3_000;

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, initialized, sessionExpired } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (initialized) {
      return;
    }

    let cancelled = false;
    let retryTimer: number | undefined;

    const runBootstrap = async () => {
      const result = await dispatch(bootstrapSessionThunk());
      if (cancelled) {
        return;
      }

      if (bootstrapSessionThunk.rejected.match(result)) {
        if (isRecoverableRefreshPayload(result.payload)) {
          retryTimer = window.setTimeout(() => {
            void runBootstrap();
          }, BOOTSTRAP_RETRY_MS);
        }
      }
    };

    void runBootstrap();

    return () => {
      cancelled = true;
      if (retryTimer) {
        window.clearTimeout(retryTimer);
      }
    };
  }, [dispatch, initialized]);

  useEffect(() => {
    if (initialized && !user) {
      if (sessionExpired) {
        router.replace("/login?expired=1");
        return;
      }
      router.replace("/login");
      return;
    }
    if (initialized && user?.mustChangePassword) {
      router.replace("/change-password-first");
    }
  }, [initialized, router, sessionExpired, user]);

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

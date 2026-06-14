"use client";

import { useEffect } from "react";
import { SessionRefreshError } from "@/src/lib/session-errors";
import { refreshSessionWithRetry } from "@/src/lib/session-refresh-coordinator";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { refreshSessionThunk } from "@/src/store/slices/auth.slice";

/** Refresh access token before the 15-minute JWT expiry while the user is active. */
const PROACTIVE_REFRESH_MS = 12 * 60 * 1000;

export function useProactiveSessionRefresh() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  useEffect(() => {
    if (!user) {
      return;
    }

    const refresh = () => {
      void refreshSessionWithRetry(async () => {
        const result = await dispatch(refreshSessionThunk());
        if (refreshSessionThunk.rejected.match(result)) {
          throw new SessionRefreshError(result.payload ?? { message: "Refresh failed" });
        }
      }).catch(() => {
        // A failed proactive refresh is handled by the next API 401 flow.
      });
    };

    const timer = window.setInterval(refresh, PROACTIVE_REFRESH_MS);
    return () => {
      window.clearInterval(timer);
    };
  }, [dispatch, user]);
}

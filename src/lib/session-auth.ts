export const HOME_PATH = "/";

let redirectScheduled = false;

export async function redirectToHomeAfterSessionExpired(message?: string) {
  if (typeof window === "undefined" || redirectScheduled) {
    return;
  }
  redirectScheduled = true;

  const { store } = await import("@/src/store");
  const { sessionExpiredThunk } = await import("@/src/store/slices/auth.slice");
  await store.dispatch(sessionExpiredThunk());

  if (message) {
    const { appToast } = await import("@/src/lib/toast");
    appToast.error(message);
  }

  if (window.location.pathname !== HOME_PATH) {
    window.location.replace(HOME_PATH);
  } else {
    redirectScheduled = false;
  }
}

export function resetSessionRedirectGuard() {
  redirectScheduled = false;
}

const REFRESH_LOCK_KEY = "cms:session-refresh-lock";
const REFRESH_CHANNEL = "cms-session-refresh";
const LOCK_TTL_MS = 30_000;
const PEER_WAIT_MS = 12_000;
const RETRY_DELAY_MS = 600;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function readLockTimestamp(): number | null {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = window.localStorage.getItem(REFRESH_LOCK_KEY);
  if (!raw) {
    return null;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function isLockHeld(): boolean {
  const ts = readLockTimestamp();
  if (ts == null) {
    return false;
  }
  return Date.now() - ts < LOCK_TTL_MS;
}

function tryAcquireRefreshLock(): boolean {
  if (typeof window === "undefined") {
    return true;
  }
  if (isLockHeld()) {
    return false;
  }
  window.localStorage.setItem(REFRESH_LOCK_KEY, String(Date.now()));
  return true;
}

function releaseRefreshLock(success = false): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(REFRESH_LOCK_KEY);
  if (!success) {
    return;
  }
  try {
    const channel = new BroadcastChannel(REFRESH_CHANNEL);
    channel.postMessage("refresh-done");
    channel.close();
  } catch {
    // BroadcastChannel may be unavailable in some environments.
  }
}

async function waitForPeerRefresh(): Promise<boolean> {
  if (typeof window === "undefined") {
    return false;
  }

  return new Promise((resolve) => {
    const deadline = Date.now() + PEER_WAIT_MS;
    let channel: BroadcastChannel | null = null;

    const finish = (value: boolean) => {
      window.clearInterval(pollTimer);
      channel?.close();
      resolve(value);
    };

    try {
      channel = new BroadcastChannel(REFRESH_CHANNEL);
      channel.onmessage = (event: MessageEvent) => {
        if (event.data === "refresh-done") {
          finish(true);
        }
      };
    } catch {
      channel = null;
    }

    const pollTimer = window.setInterval(() => {
      if (Date.now() >= deadline) {
        finish(false);
      }
    }, 200);
  });
}

/**
 * Runs a token refresh with cross-tab coordination so only one tab rotates
 * the refresh token at a time. Other tabs wait for the winner to finish.
 */
export async function runCoordinatedSessionRefresh(
  refreshFn: () => Promise<void>,
): Promise<void> {
  if (typeof window === "undefined") {
    await refreshFn();
    return;
  }

  if (!tryAcquireRefreshLock()) {
    const peerRefreshed = await waitForPeerRefresh();
    if (peerRefreshed) {
      return;
    }
    if (!tryAcquireRefreshLock()) {
      const recovered = await waitForPeerRefresh();
      if (recovered) {
        return;
      }
    }
  }

  try {
    await refreshFn();
    releaseRefreshLock(true);
  } catch (error) {
    releaseRefreshLock(false);
    throw error;
  }
}

/** Retries refresh once to recover from multi-tab rotation races or brief 429s. */
export async function refreshSessionWithRetry(
  refreshFn: () => Promise<void>,
  maxAttempts = 3,
): Promise<void> {
  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      await runCoordinatedSessionRefresh(refreshFn);
      return;
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts - 1) {
        const delay = attempt === 0 ? RETRY_DELAY_MS : RETRY_DELAY_MS * 2;
        await sleep(delay);
      }
    }
  }
  throw lastError;
}

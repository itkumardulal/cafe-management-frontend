const inflight = new Map<string, Promise<unknown>>();
const resultCache = new Map<string, { data: unknown; expiresAt: number }>();

/** Default stale window for identical GET requests (Strict Mode remounts, duplicate effects). */
export const DEFAULT_GET_STALE_MS = 5_000;

export function buildGetCacheKey(
  path: string,
  params?: Record<string, string | number | undefined>,
): string {
  if (!params) {
    return `GET:${path}`;
  }
  const entries = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== "")
    .sort(([a], [b]) => a.localeCompare(b));
  return `GET:${path}?${JSON.stringify(entries)}`;
}

export function invalidateGetCache(pathPrefix?: string) {
  if (!pathPrefix) {
    inflight.clear();
    resultCache.clear();
    return;
  }
  for (const key of [...inflight.keys()]) {
    if (key.includes(pathPrefix)) {
      inflight.delete(key);
    }
  }
  for (const key of [...resultCache.keys()]) {
    if (key.includes(pathPrefix)) {
      resultCache.delete(key);
    }
  }
}

export function fetchDeduped<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  options?: { force?: boolean; staleTimeMs?: number },
): Promise<T> {
  const staleTimeMs = options?.staleTimeMs ?? DEFAULT_GET_STALE_MS;

  if (options?.force) {
    inflight.delete(cacheKey);
    resultCache.delete(cacheKey);
  } else {
    const cached = resultCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return Promise.resolve(cached.data as T);
    }
    const existing = inflight.get(cacheKey);
    if (existing) {
      return existing as Promise<T>;
    }
  }

  const promise = fetcher()
    .then((data) => {
      if (staleTimeMs > 0) {
        resultCache.set(cacheKey, { data, expiresAt: Date.now() + staleTimeMs });
      }
      return data;
    })
    .finally(() => {
      if (inflight.get(cacheKey) === promise) {
        inflight.delete(cacheKey);
      }
    });

  inflight.set(cacheKey, promise);
  return promise;
}

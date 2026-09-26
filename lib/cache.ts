interface CacheEntry<T> {
  value: T;
  fetchedAt: string;
  expiresAt: number;
}

const FAILURE_BACKOFF_MS = 60_000;

const store = new Map<string, CacheEntry<unknown>>();
const inFlight = new Map<string, Promise<CacheEntry<unknown>>>();
const failedUntil = new Map<string, number>();

/**
 * Process-lifetime memo so upstreams (BMA, ThaiWater, RID) are hit at most once per
 * TTL no matter how many public requests arrive. Failures back off too, so a down
 * upstream can't be used to make this server hammer it.
 */
export async function cached<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<CacheEntry<T>> {
  const hit = store.get(key) as CacheEntry<T> | undefined;
  if (hit && hit.expiresAt > Date.now()) return hit;

  if ((failedUntil.get(key) ?? 0) > Date.now()) throw new Error(`${key}: upstream in failure backoff`);

  const pending = inFlight.get(key) as Promise<CacheEntry<T>> | undefined;
  if (pending) return pending;

  const promise = loader()
    .then((value) => {
      const entry = { value, fetchedAt: new Date().toISOString(), expiresAt: Date.now() + ttlMs };
      store.set(key, entry);
      failedUntil.delete(key);
      return entry;
    })
    .catch((err) => {
      failedUntil.set(key, Date.now() + FAILURE_BACKOFF_MS);
      throw err;
    })
    .finally(() => {
      inFlight.delete(key);
    });
  inFlight.set(key, promise);
  return promise;
}

export function cachedStale<T>(key: string): CacheEntry<T> | undefined {
  return store.get(key) as CacheEntry<T> | undefined;
}

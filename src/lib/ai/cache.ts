export interface TtlCacheOptions {
  /** Maximum number of entries kept before least-recently-used eviction. */
  maxEntries: number;
  /** Time-to-live per entry, in milliseconds. */
  ttlMs: number;
}

interface Entry<T> {
  value: T;
  expiresAt: number;
}

/**
 * A tiny TTL + LRU in-memory cache. Used to memoize identical AI calls so we
 * never pay latency or Vertex AI credits twice for the exact same prompt
 * (e.g. a user re-logging "drove 10 km to work"). `now` is injectable for
 * deterministic tests.
 *
 * Per-instance only — see the note in `rateLimit.ts`; the same swap-to-Redis
 * argument applies if a shared cache is ever needed.
 */
export function createTtlCache<T>({ maxEntries, ttlMs }: TtlCacheOptions) {
  // Map preserves insertion order, which we exploit for LRU: on read/write we
  // delete + re-set to move an entry to the "most recently used" tail.
  const store = new Map<string, Entry<T>>();

  function get(key: string, now: number = Date.now()): T | undefined {
    const entry = store.get(key);
    if (!entry) return undefined;

    if (now >= entry.expiresAt) {
      store.delete(key);
      return undefined;
    }

    // Mark as recently used.
    store.delete(key);
    store.set(key, entry);
    return entry.value;
  }

  function set(key: string, value: T, now: number = Date.now()): void {
    if (store.has(key)) store.delete(key);
    store.set(key, { value, expiresAt: now + ttlMs });

    // Evict the least-recently-used entry (the first key) if over capacity.
    while (store.size > maxEntries) {
      const oldest = store.keys().next().value;
      if (oldest === undefined) break;
      store.delete(oldest);
    }
  }

  return {
    get,
    set,
    get size() {
      return store.size;
    },
  };
}

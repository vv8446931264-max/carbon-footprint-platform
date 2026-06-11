export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  /** Seconds until the current window resets (for a Retry-After header). */
  resetSeconds: number;
}

export interface RateLimiterOptions {
  /** Max requests allowed per key within the window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

interface Bucket {
  count: number;
  windowStart: number;
}

/**
 * Creates a fixed-window in-memory rate limiter. Each limiter owns its own
 * Map, so limiters for different routes don't interfere and tests stay
 * isolated. `now` is injectable for deterministic testing.
 *
 * Note (documented honestly): on a horizontally-scaled host like Cloud Run
 * this is *per-instance*, so it's a first line of defence against abuse/cost
 * runaway rather than a globally-strict quota. For strict global limits you'd
 * back this with Redis/Memorystore — the interface here is deliberately
 * swap-compatible with that.
 */
export function createRateLimiter({ limit, windowMs }: RateLimiterOptions) {
  const buckets = new Map<string, Bucket>();

  function check(key: string, now: number = Date.now()): RateLimitResult {
    const existing = buckets.get(key);

    if (!existing || now - existing.windowStart >= windowMs) {
      buckets.set(key, { count: 1, windowStart: now });
      return {
        allowed: true,
        limit,
        remaining: limit - 1,
        resetSeconds: Math.ceil(windowMs / 1000),
      };
    }

    const resetSeconds = Math.ceil(
      (existing.windowStart + windowMs - now) / 1000,
    );

    if (existing.count >= limit) {
      return { allowed: false, limit, remaining: 0, resetSeconds };
    }

    existing.count += 1;
    return {
      allowed: true,
      limit,
      remaining: limit - existing.count,
      resetSeconds,
    };
  }

  /** Drops expired buckets so the Map can't grow unbounded over time. */
  function sweep(now: number = Date.now()): void {
    for (const [key, bucket] of buckets) {
      if (now - bucket.windowStart >= windowMs) buckets.delete(key);
    }
  }

  return { check, sweep };
}

/**
 * Best-effort client identifier from proxy headers. Cloud Run's front-end
 * *appends* the real client IP to `x-forwarded-for`, so the last entry is the
 * only one the client can't spoof — earlier entries are caller-supplied and
 * taking the first would let anyone dodge their per-IP quota with a header.
 */
export function clientKeyFromRequest(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const hops = forwarded.split(",");
    return hops[hops.length - 1]!.trim();
  }
  return request.headers.get("x-real-ip") ?? "anonymous";
}

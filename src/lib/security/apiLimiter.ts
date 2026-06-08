import { NextResponse } from "next/server";
import { clientKeyFromRequest, createRateLimiter } from "./rateLimit";

/**
 * Shared limiter instances. Text endpoints get a generous quota; the
 * multimodal receipt endpoint is throttled harder because each call is far
 * more expensive (vision tokens) and a tighter cap better protects the
 * Vertex AI budget against accidental or malicious bursts.
 */
const textLimiter = createRateLimiter({ limit: 20, windowMs: 60_000 });
const receiptLimiter = createRateLimiter({ limit: 6, windowMs: 60_000 });

/**
 * Global per-instance backstop. The per-client limiter keys on the client IP
 * from `X-Forwarded-For`, which a caller *can* spoof to dodge their personal
 * quota. This global counter is not keyed by IP, so total throughput (and
 * therefore Vertex AI spend) on this instance stays capped regardless — it's
 * the real guard against budget drain, with the per-IP limiter as fair-use UX.
 */
const globalLimiter = createRateLimiter({ limit: 120, windowMs: 60_000 });
const GLOBAL_KEY = "__global__";

export const limiters = { text: textLimiter, receipt: receiptLimiter };

// Opportunistic cleanup: every so often, drop expired buckets from all limiters
// so the in-memory Maps can't grow unbounded with one entry per unique IP on a
// long-running instance. Cheap, amortised, and avoids a background timer.
const allLimiters = [textLimiter, receiptLimiter, globalLimiter];
let requestsSinceSweep = 0;
const SWEEP_EVERY = 200;

function maybeSweep(now: number): void {
  if (++requestsSinceSweep < SWEEP_EVERY) return;
  requestsSinceSweep = 0;
  for (const limiter of allLimiters) limiter.sweep(now);
}

function tooManyResponse(
  resetSeconds: number,
  limit: number,
  remaining: number,
): NextResponse {
  return NextResponse.json(
    { error: "Too many requests. Please slow down and try again shortly." },
    {
      status: 429,
      headers: {
        "Retry-After": String(resetSeconds),
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Remaining": String(remaining),
      },
    },
  );
}

/**
 * Enforces both the global backstop and the per-client rate limit for a
 * request. Returns a ready-to-send 429 `NextResponse` (with `Retry-After`)
 * when the caller is over quota, or `null` to signal "proceed". Keeps the
 * rate-limit boilerplate out of each handler.
 */
export function enforceRateLimit(
  request: Request,
  limiter: ReturnType<typeof createRateLimiter>,
): NextResponse | null {
  const now = Date.now();
  maybeSweep(now);

  const global = globalLimiter.check(GLOBAL_KEY, now);
  if (!global.allowed) {
    return tooManyResponse(global.resetSeconds, global.limit, 0);
  }

  const result = limiter.check(clientKeyFromRequest(request), now);
  if (!result.allowed) {
    return tooManyResponse(result.resetSeconds, result.limit, result.remaining);
  }

  return null;
}

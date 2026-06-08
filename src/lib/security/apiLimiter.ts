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

export const limiters = { text: textLimiter, receipt: receiptLimiter };

/**
 * Enforces a rate limit for the request's client. Returns a ready-to-send 429
 * `NextResponse` (with `Retry-After`) when the caller is over quota, or `null`
 * to signal "proceed". Keeps the rate-limit boilerplate out of each handler.
 */
export function enforceRateLimit(
  request: Request,
  limiter: ReturnType<typeof createRateLimiter>,
): NextResponse | null {
  const key = clientKeyFromRequest(request);
  const result = limiter.check(key);

  if (!result.allowed) {
    return NextResponse.json(
      {
        error: "Too many requests. Please slow down and try again shortly.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(result.resetSeconds),
          "X-RateLimit-Limit": String(result.limit),
          "X-RateLimit-Remaining": String(result.remaining),
        },
      },
    );
  }

  return null;
}

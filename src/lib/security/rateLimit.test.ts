import { describe, expect, it } from "vitest";
import { clientKeyFromRequest, createRateLimiter } from "./rateLimit";

describe("createRateLimiter", () => {
  it("allows requests up to the limit, then blocks", () => {
    const limiter = createRateLimiter({ limit: 3, windowMs: 60_000 });
    const t = 1_000;

    expect(limiter.check("a", t).allowed).toBe(true);
    expect(limiter.check("a", t).allowed).toBe(true);
    const third = limiter.check("a", t);
    expect(third.allowed).toBe(true);
    expect(third.remaining).toBe(0);
    expect(limiter.check("a", t).allowed).toBe(false);
  });

  it("tracks keys independently", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 60_000 });
    expect(limiter.check("a", 0).allowed).toBe(true);
    expect(limiter.check("b", 0).allowed).toBe(true);
    expect(limiter.check("a", 0).allowed).toBe(false);
  });

  it("resets after the window elapses", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1_000 });
    expect(limiter.check("a", 0).allowed).toBe(true);
    expect(limiter.check("a", 500).allowed).toBe(false);
    expect(limiter.check("a", 1_000).allowed).toBe(true);
  });

  it("reports seconds until reset", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 10_000 });
    limiter.check("a", 0);
    expect(limiter.check("a", 3_000).resetSeconds).toBe(7);
  });

  it("sweeps expired buckets", () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1_000 });
    limiter.check("a", 0);
    limiter.sweep(2_000);
    // After sweep + window, the key is fresh again.
    expect(limiter.check("a", 2_000).allowed).toBe(true);
  });
});

describe("clientKeyFromRequest", () => {
  it("uses the first hop of x-forwarded-for", () => {
    const req = new Request("https://example.com", {
      headers: { "x-forwarded-for": "203.0.113.1, 10.0.0.1" },
    });
    expect(clientKeyFromRequest(req)).toBe("203.0.113.1");
  });

  it("falls back to anonymous when no client headers exist", () => {
    expect(clientKeyFromRequest(new Request("https://example.com"))).toBe(
      "anonymous",
    );
  });
});

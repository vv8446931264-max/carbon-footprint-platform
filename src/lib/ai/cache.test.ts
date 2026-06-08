import { describe, expect, it } from "vitest";
import { createTtlCache } from "./cache";

describe("createTtlCache", () => {
  it("returns undefined for missing keys", () => {
    const cache = createTtlCache<string>({ maxEntries: 2, ttlMs: 1000 });
    expect(cache.get("x")).toBeUndefined();
  });

  it("stores and retrieves a value within its TTL", () => {
    const cache = createTtlCache<string>({ maxEntries: 2, ttlMs: 1000 });
    cache.set("x", "hello", 0);
    expect(cache.get("x", 500)).toBe("hello");
  });

  it("expires values past their TTL", () => {
    const cache = createTtlCache<string>({ maxEntries: 2, ttlMs: 1000 });
    cache.set("x", "hello", 0);
    expect(cache.get("x", 1000)).toBeUndefined();
    expect(cache.size).toBe(0);
  });

  it("evicts the least-recently-used entry past capacity", () => {
    const cache = createTtlCache<string>({ maxEntries: 2, ttlMs: 10_000 });
    cache.set("a", "1", 0);
    cache.set("b", "2", 0);
    // Touch "a" so "b" becomes least-recently-used.
    cache.get("a", 0);
    cache.set("c", "3", 0);

    expect(cache.get("a", 0)).toBe("1");
    expect(cache.get("c", 0)).toBe("3");
    expect(cache.get("b", 0)).toBeUndefined();
    expect(cache.size).toBe(2);
  });
});

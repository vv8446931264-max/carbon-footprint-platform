import { describe, expect, it, vi } from "vitest";
import { drawImpactCard } from "./impactCard";

/**
 * A minimal stand-in for CanvasRenderingContext2D that records calls instead
 * of rendering pixels — lets us assert the drawing logic runs to completion
 * and references the data we pass in, without a real browser canvas.
 */
function createStubContext() {
  const calls: Array<{ method: string; args: unknown[] }> = [];

  const handler: ProxyHandler<Record<string, unknown>> = {
    get(target, prop: string) {
      if (prop === "calls") return calls;
      if (prop === "createLinearGradient") {
        return () => ({ addColorStop: vi.fn() });
      }
      if (prop in target) return target[prop];
      return (...args: unknown[]) => {
        calls.push({ method: prop, args });
      };
    },
    set(target, prop: string, value) {
      target[prop] = value;
      return true;
    },
  };

  return new Proxy({}, handler) as unknown as CanvasRenderingContext2D & {
    calls: typeof calls;
  };
}

describe("drawImpactCard", () => {
  it("renders without throwing and draws the headline number", () => {
    const ctx = createStubContext();
    drawImpactCard(ctx, {
      totalKgCo2e: 42.5,
      periodDays: 30,
      streak: 5,
      topCategoryLabel: "Transport",
    });

    const fillTextCalls = ctx.calls
      .filter((c) => c.method === "fillText")
      .map((c) => c.args[0]);
    expect(fillTextCalls).toContain("42.5");
    expect(
      fillTextCalls.some(
        (text) => typeof text === "string" && text.includes("5-day streak"),
      ),
    ).toBe(true);
    expect(
      fillTextCalls.some(
        (text) => typeof text === "string" && text.includes("Transport"),
      ),
    ).toBe(true);
  });

  it("falls back gracefully when there is no top category yet", () => {
    const ctx = createStubContext();
    drawImpactCard(ctx, {
      totalKgCo2e: 0,
      periodDays: 30,
      streak: 0,
      topCategoryLabel: null,
    });

    const fillTextCalls = ctx.calls
      .filter((c) => c.method === "fillText")
      .map((c) => c.args[0]);
    expect(
      fillTextCalls.some(
        (text) =>
          typeof text === "string" && text.includes("Just getting started"),
      ),
    ).toBe(true);
  });
});

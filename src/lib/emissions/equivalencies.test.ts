import { describe, expect, it } from "vitest";
import { carbonEquivalencies } from "./equivalencies";

describe("carbonEquivalencies", () => {
  it("returns all zeros for zero input", () => {
    expect(carbonEquivalencies(0)).toEqual({
      treesForAYear: 0,
      carKmAvoided: 0,
      phoneCharges: 0,
    });
  });

  it("clamps negative input to zero", () => {
    expect(carbonEquivalencies(-50).carKmAvoided).toBe(0);
  });

  it("converts kg into trees, car km, and phone charges", () => {
    const eq = carbonEquivalencies(210);
    expect(eq.treesForAYear).toBe(10); // 210 / 21
    expect(eq.carKmAvoided).toBe(Math.round(210 / 0.192)); // ~1094
    expect(eq.phoneCharges).toBe(Math.round(210 / 0.00822));
  });
});

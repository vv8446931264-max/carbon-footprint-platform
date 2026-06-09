import { describe, expect, it } from "vitest";
import type { BaselineAnswers } from "@/lib/baseline/estimate";
import {
  annualBreakdownFromBaseline,
  annualBreakdownFromEntries,
  hasModelledFootprint,
  simulate,
  ZERO_LEVERS,
  type AnnualBreakdown,
} from "./reductionSimulator";

const breakdown: AnnualBreakdown = {
  transportKg: 2000,
  foodKg: 2000,
  energyKg: 1000,
  shoppingKg: 800,
  otherKg: 200, // not reducible by levers
};

describe("simulate", () => {
  it("returns the base footprint unchanged with zero levers", () => {
    const result = simulate(breakdown, ZERO_LEVERS);
    expect(result.baseAnnualKg).toBe(6000);
    expect(result.newAnnualKg).toBe(6000);
    expect(result.savedAnnualKg).toBe(0);
    expect(result.pctReduction).toBe(0);
    expect(result.meetsTarget).toBe(false);
  });

  it("reduces each bucket by its lever fraction and leaves `other` intact", () => {
    const result = simulate(breakdown, {
      transport: 0.5, // -1000
      food: 0.5, // -1000
      energy: 1, // -1000
      shopping: 0.25, // -200
    });
    expect(result.savedAnnualKg).toBe(3200);
    expect(result.newAnnualKg).toBe(2800);
    expect(result.pctReduction).toBeCloseTo(3200 / 6000, 5);
  });

  it("flags when the projected footprint reaches the 2 t target", () => {
    const result = simulate(breakdown, {
      transport: 0.6,
      food: 0.6,
      energy: 0.8,
      shopping: 0.6,
    });
    // saved = 1200 + 1200 + 800 + 480 = 3680 -> new = 2320 kg (still > 2000)
    expect(result.meetsTarget).toBe(false);
    const aggressive = simulate(
      { ...breakdown, otherKg: 0 },
      { transport: 1, food: 1, energy: 1, shopping: 1 },
    );
    expect(aggressive.newAnnualKg).toBe(0);
    expect(aggressive.meetsTarget).toBe(true);
  });

  it("clamps out-of-range lever values", () => {
    const result = simulate(breakdown, {
      transport: 5,
      food: -2,
      energy: 0,
      shopping: 0,
    });
    expect(result.savedAnnualKg).toBe(2000); // transport fully cut, food untouched
  });
});

describe("annualBreakdownFromEntries", () => {
  it("annualises a 30-day period into yearly buckets", () => {
    const result = annualBreakdownFromEntries(
      [
        { category: "transport", kgCo2e: 100 },
        { category: "food", kgCo2e: 50 },
        { category: "waste", kgCo2e: 10 },
      ],
      30,
    );
    expect(result.transportKg).toBeCloseTo((100 * 365) / 30, 5);
    expect(result.foodKg).toBeCloseTo((50 * 365) / 30, 5);
    expect(result.otherKg).toBeCloseTo((10 * 365) / 30, 5);
    expect(result.energyKg).toBe(0);
  });
});

describe("annualBreakdownFromBaseline", () => {
  it("maps baseline answers to buckets (diet→food, home→energy, flights→other)", () => {
    const answers: BaselineAnswers = {
      transport: "car", // 2500
      diet: "average", // 2500 -> food
      home: "average", // 1800 -> energy
      flights: "some", // 500 -> other
      shopping: "average", // 900
    };
    expect(annualBreakdownFromBaseline(answers)).toEqual({
      transportKg: 2500,
      foodKg: 2500,
      energyKg: 1800,
      shoppingKg: 900,
      otherKg: 500,
    });
  });

  it("treats unanswered questions as zero", () => {
    expect(hasModelledFootprint(annualBreakdownFromBaseline({}))).toBe(false);
  });
});

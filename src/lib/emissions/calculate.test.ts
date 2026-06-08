import { describe, expect, it } from "vitest";
import { calculateEmissionsKgCo2e, sumEmissions } from "./calculate";
import { suggestSwap } from "./compare";
import type { Activity } from "@/types/activity";

describe("calculateEmissionsKgCo2e", () => {
  it("computes transport emissions as factor * distance", () => {
    const activity: Activity = { category: "transport", mode: "car_petrol", distanceKm: 100 };
    expect(calculateEmissionsKgCo2e(activity)).toBeCloseTo(19.2, 5);
  });

  it("returns zero for zero-emission transport modes", () => {
    expect(calculateEmissionsKgCo2e({ category: "transport", mode: "bike", distanceKm: 50 })).toBe(0);
    expect(calculateEmissionsKgCo2e({ category: "transport", mode: "walk", distanceKm: 50 })).toBe(0);
  });

  it("computes energy emissions as factor * kWh", () => {
    const activity: Activity = { category: "energy", source: "grid_electricity", amountKwh: 10 };
    expect(calculateEmissionsKgCo2e(activity)).toBeCloseTo(2.33, 5);
  });

  it("computes food emissions as factor * quantity", () => {
    const activity: Activity = { category: "food", food: "beef", quantityKg: 0.5 };
    expect(calculateEmissionsKgCo2e(activity)).toBeCloseTo(13.5, 5);
  });

  it("computes shopping emissions from amount spent", () => {
    const activity: Activity = { category: "shopping", itemType: "clothing", amountSpentUsd: 40 };
    expect(calculateEmissionsKgCo2e(activity)).toBeCloseTo(20, 5);
  });

  it("computes waste emissions as factor * weight, with recycling reducing impact", () => {
    const landfill: Activity = { category: "waste", wasteType: "landfill", weightKg: 10 };
    const recycled: Activity = { category: "waste", wasteType: "recycled", weightKg: 10 };
    expect(calculateEmissionsKgCo2e(landfill)).toBeGreaterThan(calculateEmissionsKgCo2e(recycled));
  });

  it("never returns a negative value", () => {
    const activity: Activity = { category: "transport", mode: "train", distanceKm: 0 };
    expect(calculateEmissionsKgCo2e(activity)).toBeGreaterThanOrEqual(0);
  });
});

describe("sumEmissions", () => {
  it("sums an array of values", () => {
    expect(sumEmissions([1.111, 2.222, 3.333])).toBeCloseTo(6.666, 3);
  });

  it("returns 0 for an empty array", () => {
    expect(sumEmissions([])).toBe(0);
  });
});

describe("suggestSwap", () => {
  it("suggests train over petrol car and quantifies the saving", () => {
    const suggestion = suggestSwap({ category: "transport", mode: "car_petrol", distanceKm: 100 });
    expect(suggestion).not.toBeNull();
    expect(suggestion!.savingsKgCo2e).toBeGreaterThan(0);
    expect(suggestion!.savingsPercent).toBeGreaterThan(0);
    expect(suggestion!.alternativeKgCo2e).toBeLessThan(suggestion!.originalKgCo2e);
  });

  it("returns null when no lower-carbon alternative is defined", () => {
    expect(suggestSwap({ category: "transport", mode: "bike", distanceKm: 10 })).toBeNull();
    expect(suggestSwap({ category: "food", food: "beef", quantityKg: 1 })).toBeNull();
  });
});

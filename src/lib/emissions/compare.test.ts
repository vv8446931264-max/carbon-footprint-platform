import { describe, expect, it } from "vitest";
import { suggestSwap } from "./compare";

describe("suggestSwap", () => {
  it("suggests the train for a petrol car trip with quantified savings", () => {
    const swap = suggestSwap({
      category: "transport",
      mode: "car_petrol",
      distanceKm: 20,
    });

    expect(swap).not.toBeNull();
    expect(swap!.label).toMatch(/train/i);
    expect(swap!.savingsKgCo2e).toBeGreaterThan(0);
    expect(swap!.alternativeKgCo2e).toBeLessThan(swap!.originalKgCo2e);
    expect(swap!.savingsPercent).toBeGreaterThan(0);
    expect(swap!.savingsPercent).toBeLessThanOrEqual(100);
    expect(typeof swap!.costSavingUsd).toBe("number");
  });

  it("scales savings with distance", () => {
    const short = suggestSwap({
      category: "transport",
      mode: "car_petrol",
      distanceKm: 5,
    });
    const long = suggestSwap({
      category: "transport",
      mode: "car_petrol",
      distanceKm: 50,
    });
    expect(long!.savingsKgCo2e).toBeGreaterThan(short!.savingsKgCo2e);
    // Percentage saving is distance-independent for the same mode pair.
    expect(long!.savingsPercent).toBeCloseTo(short!.savingsPercent, 5);
  });

  it("returns null for non-transport activities", () => {
    expect(
      suggestSwap({ category: "food", food: "beef", quantityKg: 0.2 }),
    ).toBeNull();
  });

  it("returns null for modes that are already low-carbon", () => {
    for (const mode of ["train", "bike", "walk", "bus"] as const) {
      expect(
        suggestSwap({ category: "transport", mode, distanceKm: 10 }),
      ).toBeNull();
    }
  });

  it("never suggests a swap with zero or negative carbon savings", () => {
    const swap = suggestSwap({
      category: "transport",
      mode: "flight_short",
      distanceKm: 400,
    });
    if (swap) expect(swap.savingsKgCo2e).toBeGreaterThan(0);
  });
});

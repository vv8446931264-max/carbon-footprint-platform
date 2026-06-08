import { describe, expect, it } from "vitest";
import { estimateCostUsd } from "./cost";

describe("estimateCostUsd", () => {
  it("estimates transport cost from distance and mode", () => {
    expect(
      estimateCostUsd({
        category: "transport",
        mode: "car_petrol",
        distanceKm: 10,
      }),
    ).toBe(1.6);
  });

  it("treats walking and cycling as free", () => {
    expect(
      estimateCostUsd({ category: "transport", mode: "walk", distanceKm: 5 }),
    ).toBe(0);
    expect(
      estimateCostUsd({ category: "transport", mode: "bike", distanceKm: 5 }),
    ).toBe(0);
  });

  it("estimates energy cost per kWh", () => {
    expect(
      estimateCostUsd({
        category: "energy",
        source: "grid_electricity",
        amountKwh: 100,
      }),
    ).toBe(17);
  });

  it("estimates food cost per kg", () => {
    expect(
      estimateCostUsd({ category: "food", food: "beef", quantityKg: 0.5 }),
    ).toBe(6.5);
  });

  it("uses the spend directly for shopping", () => {
    expect(
      estimateCostUsd({
        category: "shopping",
        itemType: "clothes",
        amountSpentUsd: 49.99,
      }),
    ).toBe(49.99);
  });

  it("treats waste as free to the individual", () => {
    expect(
      estimateCostUsd({
        category: "waste",
        wasteType: "landfill",
        weightKg: 3,
      }),
    ).toBe(0);
  });
});

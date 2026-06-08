import type { Activity } from "@/types/activity";
import {
  ENERGY_FACTORS,
  FOOD_FACTORS,
  SHOPPING_FACTOR_PER_USD,
  TRANSPORT_FACTORS,
  WASTE_FACTORS,
} from "./factors";

/**
 * Pure function: computes kg CO2-equivalent for a single activity.
 * No I/O, no side effects — fully unit-testable in isolation.
 */
export function calculateEmissionsKgCo2e(activity: Activity): number {
  switch (activity.category) {
    case "transport":
      return roundTo(TRANSPORT_FACTORS[activity.mode] * activity.distanceKm, 3);
    case "energy":
      return roundTo(ENERGY_FACTORS[activity.source] * activity.amountKwh, 3);
    case "food":
      return roundTo(FOOD_FACTORS[activity.food] * activity.quantityKg, 3);
    case "shopping":
      return roundTo(SHOPPING_FACTOR_PER_USD * activity.amountSpentUsd, 3);
    case "waste":
      return roundTo(WASTE_FACTORS[activity.wasteType] * activity.weightKg, 3);
  }
}

export function sumEmissions(values: number[]): number {
  return roundTo(
    values.reduce((total, value) => total + value, 0),
    3,
  );
}

/** Average global per-capita annual footprint, used as a comparison baseline (tonnes CO2e). */
export const GLOBAL_AVERAGE_ANNUAL_TONNES = 4.7;

export function tonnesToKg(tonnes: number): number {
  return tonnes * 1000;
}

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

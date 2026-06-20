import type { Activity } from "@/types/activity";
import {
  ENERGY_FACTORS,
  FOOD_FACTORS,
  SHOPPING_FACTOR_PER_USD,
  TRANSPORT_FACTORS,
  WASTE_FACTORS,
} from "./factors";

/**
 * Computes kg CO₂-equivalent for a single activity using published emission
 * factors. Pure: no I/O, no side effects — fully unit-testable in isolation.
 *
 * @param activity - A structured, schema-validated activity (transport, energy,
 *   food, shopping, or waste) carrying its category-specific quantity.
 * @returns Emissions in kg CO₂e, rounded to 3 decimal places.
 *
 * @example
 * ```ts
 * calculateEmissionsKgCo2e({ category: "transport", mode: "car_petrol", distanceKm: 10 });
 * // => 1.92  (0.192 kg/km × 10 km)
 * ```
 *
 * @remarks
 * The `switch` is exhaustive over the {@link Activity} discriminated union, so
 * adding a new category surfaces here as a compile error — by design. Emission
 * factors live in `./factors.ts`; see ARCHITECTURE.md for their sourcing.
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

/**
 * Sums a list of emission values, rounding the total to 3 decimals to avoid
 * floating-point drift accumulating across many entries.
 *
 * @param values - Individual emission amounts in kg CO₂e.
 * @returns The total in kg CO₂e, rounded to 3 decimal places.
 */
export function sumEmissions(values: number[]): number {
  return roundTo(
    values.reduce((total, value) => total + value, 0),
    3,
  );
}

/** Average global per-capita annual footprint (tonnes CO2e). */
export const GLOBAL_AVERAGE_ANNUAL_TONNES = 4.7;

/**
 * Urban India per-capita annual footprint. India's national average is ~2 t
 * (already near the Paris target), but urban households — the primary audience
 * for this app — typically reach 4–5 t/year due to car use, AC, and higher
 * consumption. Used as the comparison marker instead of the global average so
 * the scale is meaningful for Indian users.
 */
export const INDIA_URBAN_AVERAGE_ANNUAL_TONNES = 4.5;

/**
 * Paris-aligned per-capita target: to keep warming well below 2°C, individual
 * footprints need to fall to ~2 tonnes CO2e/year. We use this as the *primary*
 * goal line (more meaningful than "beat the average"), matching how credible
 * calculators frame progress. ~2000 kg / 365 ≈ 5.5 kg/day.
 */
export const PARIS_ALIGNED_ANNUAL_TONNES = 2.0;

export function tonnesToKg(tonnes: number): number {
  return tonnes * 1000;
}

/** Daily share of the Paris-aligned annual target, in kg CO2e. */
export const PARIS_ALIGNED_DAILY_KG =
  tonnesToKg(PARIS_ALIGNED_ANNUAL_TONNES) / 365;

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

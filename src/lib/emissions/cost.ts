import type {
  Activity,
  EnergySource,
  FoodType,
  TransportMode,
} from "@/types/activity";

/**
 * Rough out-of-pocket cost factors, sourced from publicly published consumer
 * averages (simplified for demo purposes). These let us show the *money* angle
 * alongside carbon — pairing each kilogram of CO₂e with a dollar figure is a
 * far stronger behaviour-change lever than emissions alone ("the train is both
 * greener AND cheaper").
 *
 * Transport: USD per km (fuel + typical running/fare cost).
 * Energy: USD per kWh. Food: USD per kg. Waste: treated as ~free to the user.
 */
export const TRANSPORT_COST_PER_KM: Record<TransportMode, number> = {
  car_petrol: 0.16,
  car_diesel: 0.15,
  car_electric: 0.05,
  bus: 0.1,
  train: 0.13,
  flight_short: 0.18,
  flight_long: 0.11,
  bike: 0,
  walk: 0,
};

export const ENERGY_COST_PER_KWH: Record<EnergySource, number> = {
  grid_electricity: 0.17,
  natural_gas: 0.07,
  lpg: 0.1,
  renewable: 0.15,
};

export const FOOD_COST_PER_KG: Record<FoodType, number> = {
  beef: 13,
  lamb: 16,
  pork: 8,
  chicken: 7,
  fish: 14,
  dairy: 4,
  vegetables: 3,
  grains: 2,
};

/**
 * Pure function: estimates the out-of-pocket cost (USD) of a single activity.
 * Mirrors `calculateEmissionsKgCo2e` so the two always travel together.
 * No I/O, no side effects — fully unit-testable in isolation.
 */
export function estimateCostUsd(activity: Activity): number {
  switch (activity.category) {
    case "transport":
      return round(TRANSPORT_COST_PER_KM[activity.mode] * activity.distanceKm);
    case "energy":
      return round(ENERGY_COST_PER_KWH[activity.source] * activity.amountKwh);
    case "food":
      return round(FOOD_COST_PER_KG[activity.food] * activity.quantityKg);
    case "shopping":
      // The spend *is* the cost.
      return round(activity.amountSpentUsd);
    case "waste":
      // No meaningful direct per-kg cost to the individual.
      return 0;
  }
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

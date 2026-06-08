import type { EnergySource, FoodType, TransportMode } from "@/types/activity";

/**
 * Emission factors sourced from publicly published averages
 * (DEFRA/EPA style figures, simplified for demo purposes).
 * Transport: kg CO2e per km. Energy: kg CO2e per kWh.
 * Food: kg CO2e per kg of food. Waste: kg CO2e per kg of waste.
 */
export const TRANSPORT_FACTORS: Record<TransportMode, number> = {
  car_petrol: 0.192,
  car_diesel: 0.171,
  car_electric: 0.053,
  bus: 0.105,
  train: 0.041,
  flight_short: 0.255,
  flight_long: 0.195,
  bike: 0,
  walk: 0,
};

export const ENERGY_FACTORS: Record<EnergySource, number> = {
  grid_electricity: 0.233,
  natural_gas: 0.184,
  lpg: 0.214,
  renewable: 0.024,
};

export const FOOD_FACTORS: Record<FoodType, number> = {
  beef: 27,
  lamb: 22,
  pork: 7.6,
  chicken: 4.6,
  fish: 3.9,
  dairy: 2.1,
  vegetables: 0.4,
  grains: 1.4,
};

export const WASTE_FACTORS: Record<
  "landfill" | "recycled" | "composted",
  number
> = {
  landfill: 0.58,
  recycled: 0.1,
  composted: 0.05,
};

/** Rough kg CO2e emitted per US dollar spent, by shopping category (lifecycle estimate). */
export const SHOPPING_FACTOR_PER_USD = 0.5;

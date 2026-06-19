/**
 * Single source of truth for activity vocabularies. The runtime `as const`
 * arrays and the compile-time union types are derived from the *same*
 * declaration, so they can never drift — adding a value in one place updates
 * both the TypeScript type and the Zod schema (which imports these arrays).
 */

export const ACTIVITY_CATEGORIES = [
  "transport",
  "energy",
  "food",
  "shopping",
  "waste",
] as const;
export type ActivityCategory = (typeof ACTIVITY_CATEGORIES)[number];

export const TRANSPORT_MODES = [
  "car_petrol",
  "car_diesel",
  "car_electric",
  "bus",
  "train",
  "flight_short",
  "flight_long",
  "bike",
  "walk",
] as const;
export type TransportMode = (typeof TRANSPORT_MODES)[number];

export const ENERGY_SOURCES = [
  "grid_electricity",
  "natural_gas",
  "lpg",
  "renewable",
] as const;
export type EnergySource = (typeof ENERGY_SOURCES)[number];

export const FOOD_TYPES = [
  "beef",
  "lamb",
  "pork",
  "chicken",
  "fish",
  "dairy",
  "vegetables",
  "grains",
] as const;
export type FoodType = (typeof FOOD_TYPES)[number];

export const WASTE_TYPES = ["landfill", "recycled", "composted"] as const;
export type WasteType = (typeof WASTE_TYPES)[number];

export interface TransportActivity {
  category: "transport";
  mode: TransportMode;
  distanceKm: number;
}

export interface EnergyActivity {
  category: "energy";
  source: EnergySource;
  amountKwh: number;
}

export interface FoodActivity {
  category: "food";
  food: FoodType;
  quantityKg: number;
}

export interface ShoppingActivity {
  category: "shopping";
  itemType: string;
  amountSpentUsd: number;
}

export interface WasteActivity {
  category: "waste";
  wasteType: WasteType;
  weightKg: number;
}

export type Activity =
  | TransportActivity
  | EnergyActivity
  | FoodActivity
  | ShoppingActivity
  | WasteActivity;

export interface LoggedActivity {
  id: string;
  loggedAt: string;
  description: string;
  activity: Activity;
  emissionsKgCo2e: number;
  confidence?: "high" | "medium" | "low";
}

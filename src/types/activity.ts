export type ActivityCategory = "transport" | "energy" | "food" | "shopping" | "waste";

export type TransportMode =
  | "car_petrol"
  | "car_diesel"
  | "car_electric"
  | "bus"
  | "train"
  | "flight_short"
  | "flight_long"
  | "bike"
  | "walk";

export type EnergySource = "grid_electricity" | "natural_gas" | "lpg" | "renewable";

export type FoodType = "beef" | "lamb" | "pork" | "chicken" | "fish" | "dairy" | "vegetables" | "grains";

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
  wasteType: "landfill" | "recycled" | "composted";
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
}

export interface Swap {
  /** Emoji shown on the swap card. */
  icon: string;
  /** The higher-carbon habit being replaced. */
  from: string;
  /** The lower-carbon alternative. */
  to: string;
  /** Estimated CO₂ saved per `unit`, in kg. */
  savingKg: number;
  /** The basis the saving applies to (e.g. "per meal"). */
  unit: string;
  /** Text used to prefill the activity logger when the swap is applied. */
  prefill: string;
}

/** Static "Smart Swaps" suggestions surfaced in the coach hub carousel. */
export const SWAPS: Swap[] = [
  { icon: "🥘", from: "Mutton curry", to: "Paneer curry", savingKg: 4.0, unit: "per meal", prefill: "chose paneer curry instead of mutton for dinner" },
  { icon: "🚗", from: "Car", to: "Auto/Bus", savingKg: 2.5, unit: "per trip", prefill: "took public transport instead of driving" },
  { icon: "🌀", from: "Tumble dryer", to: "Line dry", savingKg: 1.5, unit: "per load", prefill: "air-dried clothes instead of using tumble dryer" },
  { icon: "🥛", from: "Buffalo milk", to: "Plant milk", savingKg: 0.8, unit: "per litre", prefill: "switched to plant-based milk instead of dairy" },
  { icon: "🍛", from: "Chicken biryani", to: "Veg biryani", savingKg: 3.0, unit: "per meal", prefill: "chose vegetable biryani instead of chicken" },
  { icon: "✈️", from: "Flight", to: "Train", savingKg: 80.0, unit: "per trip", prefill: "took the train instead of flying" },
];

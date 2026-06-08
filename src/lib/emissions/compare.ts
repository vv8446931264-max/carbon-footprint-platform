import type { Activity, TransportActivity } from "@/types/activity";
import { calculateEmissionsKgCo2e } from "./calculate";

export interface SwapSuggestion {
  label: string;
  originalKgCo2e: number;
  alternativeKgCo2e: number;
  savingsKgCo2e: number;
  savingsPercent: number;
}

const TRANSPORT_ALTERNATIVES: Partial<
  Record<TransportActivity["mode"], TransportActivity["mode"]>
> = {
  car_petrol: "train",
  car_diesel: "train",
  flight_short: "train",
};

/**
 * Suggests a lower-carbon alternative for an activity, when one exists,
 * and quantifies the saving. Pure function — easy to test and extend.
 */
export function suggestSwap(activity: Activity): SwapSuggestion | null {
  if (activity.category !== "transport") return null;

  const alternativeMode = TRANSPORT_ALTERNATIVES[activity.mode];
  if (!alternativeMode) return null;

  const original = calculateEmissionsKgCo2e(activity);
  const alternative = calculateEmissionsKgCo2e({
    category: "transport",
    mode: alternativeMode,
    distanceKm: activity.distanceKm,
  });

  const savings = original - alternative;
  if (savings <= 0) return null;

  return {
    label: `Swap ${describeMode(activity.mode)} for ${describeMode(alternativeMode)}`,
    originalKgCo2e: original,
    alternativeKgCo2e: alternative,
    savingsKgCo2e: round(savings),
    savingsPercent: round((savings / original) * 100),
  };
}

function describeMode(mode: TransportActivity["mode"]): string {
  return mode.replace(/_/g, " ");
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

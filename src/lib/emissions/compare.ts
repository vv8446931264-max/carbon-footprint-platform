import type { Activity, TransportActivity } from "@/types/activity";
import { calculateEmissionsKgCo2e } from "./calculate";
import { estimateCostUsd } from "./cost";

export interface SwapSuggestion {
  label: string;
  originalKgCo2e: number;
  alternativeKgCo2e: number;
  savingsKgCo2e: number;
  savingsPercent: number;
  /** Positive when the greener alternative is also cheaper (USD). */
  costSavingUsd: number;
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
 * and quantifies both the carbon AND the money saved. Pure function — easy
 * to test and extend. Surfacing the dollar saving alongside the kilograms
 * is what turns a guilt-free "nudge" into a genuinely persuasive one.
 */
export function suggestSwap(activity: Activity): SwapSuggestion | null {
  if (activity.category !== "transport") return null;

  const alternativeMode = TRANSPORT_ALTERNATIVES[activity.mode];
  if (!alternativeMode) return null;

  const alternativeActivity: TransportActivity = {
    category: "transport",
    mode: alternativeMode,
    distanceKm: activity.distanceKm,
  };

  const original = calculateEmissionsKgCo2e(activity);
  const alternative = calculateEmissionsKgCo2e(alternativeActivity);

  const savings = original - alternative;
  if (savings <= 0) return null;

  const costSaving =
    estimateCostUsd(activity) - estimateCostUsd(alternativeActivity);

  return {
    label: `Swap ${describeMode(activity.mode)} for ${describeMode(alternativeMode)}`,
    originalKgCo2e: original,
    alternativeKgCo2e: alternative,
    savingsKgCo2e: round(savings),
    savingsPercent: round((savings / original) * 100),
    costSavingUsd: round(costSaving),
  };
}

function describeMode(mode: TransportActivity["mode"]): string {
  return mode.replace(/_/g, " ");
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

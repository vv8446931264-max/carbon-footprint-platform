import {
  BASELINE_QUESTIONS,
  type BaselineAnswers,
} from "@/lib/baseline/estimate";
import {
  PARIS_ALIGNED_ANNUAL_TONNES,
  tonnesToKg,
} from "@/lib/emissions/calculate";
import type { CategoryTotal } from "@/lib/emissions/aggregate";

/**
 * Annual footprint split into the buckets the simulator's levers act on, in kg
 * CO2e. `otherKg` (flights, waste, anything unmodelled) is carried along so the
 * total stays honest but isn't reduced by the levers.
 */
export interface AnnualBreakdown {
  transportKg: number;
  foodKg: number;
  energyKg: number;
  shoppingKg: number;
  otherKg: number;
}

export const LEVER_IDS = ["transport", "food", "energy", "shopping"] as const;
export type LeverId = (typeof LEVER_IDS)[number];

/** Per-lever fraction (0–1) of that bucket the person commits to cutting. */
export type Levers = Record<LeverId, number>;

export const ZERO_LEVERS: Levers = {
  transport: 0,
  food: 0,
  energy: 0,
  shopping: 0,
};

export interface LeverConfig {
  id: LeverId;
  label: string;
  hint: string;
  /** Realistic upper bound for an individual (you can't cut 100% of transport). */
  max: number;
}

export const LEVER_CONFIG: LeverConfig[] = [
  {
    id: "transport",
    label: "Drive less",
    hint: "Carpool, combine trips, or shift to transit, cycling and walking.",
    max: 0.6,
  },
  {
    id: "food",
    label: "Eat lower-carbon",
    hint: "Swap some red meat for chicken, fish, or plant-based meals.",
    max: 0.6,
  },
  {
    id: "energy",
    label: "Cleaner home energy",
    hint: "Switch to a renewable plan, improve efficiency, lower the thermostat.",
    max: 0.8,
  },
  {
    id: "shopping",
    label: "Buy less, buy used",
    hint: "Repair, reuse, and choose second-hand over new where you can.",
    max: 0.6,
  },
];

export interface Preset {
  id: string;
  label: string;
  levers: Levers;
}

export const PRESETS: Preset[] = [
  {
    id: "quick-wins",
    label: "Quick wins",
    levers: { transport: 0.15, food: 0.2, energy: 0.1, shopping: 0.2 },
  },
  {
    id: "ambitious",
    label: "Ambitious",
    levers: { transport: 0.5, food: 0.5, energy: 0.7, shopping: 0.5 },
  },
];

export interface SimulationResult {
  baseAnnualKg: number;
  newAnnualKg: number;
  savedAnnualKg: number;
  baseTonnes: number;
  newTonnes: number;
  savedTonnes: number;
  /** Fraction of the total footprint removed (0–1). */
  pctReduction: number;
  /** True when the simulated annual footprint reaches the ~2 t Paris target. */
  meetsTarget: boolean;
}

const TARGET_KG = tonnesToKg(PARIS_ALIGNED_ANNUAL_TONNES);

/** Applies the chosen levers to a breakdown and returns the projected totals. */
export function simulate(
  breakdown: AnnualBreakdown,
  levers: Levers,
): SimulationResult {
  const baseAnnualKg =
    breakdown.transportKg +
    breakdown.foodKg +
    breakdown.energyKg +
    breakdown.shoppingKg +
    breakdown.otherKg;

  const savedAnnualKg =
    breakdown.transportKg * clamp01(levers.transport) +
    breakdown.foodKg * clamp01(levers.food) +
    breakdown.energyKg * clamp01(levers.energy) +
    breakdown.shoppingKg * clamp01(levers.shopping);

  const newAnnualKg = Math.max(baseAnnualKg - savedAnnualKg, 0);

  return {
    baseAnnualKg,
    newAnnualKg,
    savedAnnualKg,
    baseTonnes: kgToTonnes(baseAnnualKg),
    newTonnes: kgToTonnes(newAnnualKg),
    savedTonnes: kgToTonnes(savedAnnualKg),
    pctReduction: baseAnnualKg > 0 ? savedAnnualKg / baseAnnualKg : 0,
    meetsTarget: newAnnualKg <= TARGET_KG,
  };
}

/** Annualises a period's category totals into the simulator's buckets. */
export function annualBreakdownFromEntries(
  categoryTotals: CategoryTotal[],
  periodDays: number,
): AnnualBreakdown {
  const factor = periodDays > 0 ? 365 / periodDays : 0;
  const byCategory = new Map<string, number>(
    categoryTotals.map((entry) => [entry.category, entry.kgCo2e]),
  );
  const get = (category: string) =>
    (byCategory.get(category) ?? 0) * factor;
  return {
    transportKg: get("transport"),
    foodKg: get("food"),
    energyKg: get("energy"),
    shoppingKg: get("shopping"),
    otherKg: get("waste"),
  };
}

/** Derives the buckets from the five-question baseline estimate. */
export function annualBreakdownFromBaseline(
  answers: BaselineAnswers,
): AnnualBreakdown {
  const annualKgFor = (questionId: string): number => {
    const question = BASELINE_QUESTIONS.find((q) => q.id === questionId);
    if (!question) return 0;
    const option = question.options.find(
      (o) => o.value === answers[question.id],
    );
    return option?.annualKg ?? 0;
  };

  return {
    transportKg: annualKgFor("transport"),
    foodKg: annualKgFor("diet"),
    energyKg: annualKgFor("home"),
    shoppingKg: annualKgFor("shopping"),
    otherKg: annualKgFor("flights"),
  };
}

export function hasModelledFootprint(breakdown: AnnualBreakdown): boolean {
  return (
    breakdown.transportKg +
      breakdown.foodKg +
      breakdown.energyKg +
      breakdown.shoppingKg +
      breakdown.otherKg >
    0
  );
}

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(Math.max(value, 0), 1);
}

function kgToTonnes(kg: number): number {
  return Math.round((kg / 1000) * 100) / 100;
}

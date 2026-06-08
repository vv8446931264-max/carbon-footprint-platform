import { z } from "zod";
import {
  ACTIVITY_CATEGORIES,
  ENERGY_SOURCES,
  FOOD_TYPES,
  TRANSPORT_MODES,
  WASTE_TYPES,
  type ActivityCategory,
} from "@/types/activity";

/**
 * The Zod side of the AI-output contract. The category/mode/etc. vocabularies
 * are imported from `types/activity` (the single source of truth), so the
 * runtime schema and the compile-time types can never drift. Both the
 * natural-language parser and the receipt interpreter validate against this
 * before any model-produced value is trusted by the calculator or the UI.
 */

/**
 * Discriminated-union schema mirroring `Activity`. Validating the model's
 * JSON output against this schema is what makes the parser safe to trust:
 * any field the model gets wrong (bad enum, missing number, NaN, negative,
 * absurdly large) is rejected here rather than propagating downstream.
 */
export const activitySchema = z.discriminatedUnion("category", [
  z.object({
    category: z.literal("transport"),
    mode: z.enum(TRANSPORT_MODES),
    distanceKm: z.number().nonnegative().max(100_000),
  }),
  z.object({
    category: z.literal("energy"),
    source: z.enum(ENERGY_SOURCES),
    amountKwh: z.number().nonnegative().max(1_000_000),
  }),
  z.object({
    category: z.literal("food"),
    food: z.enum(FOOD_TYPES),
    quantityKg: z.number().nonnegative().max(10_000),
  }),
  z.object({
    category: z.literal("shopping"),
    itemType: z.string().min(1).max(100),
    amountSpentUsd: z.number().nonnegative().max(10_000_000),
  }),
  z.object({
    category: z.literal("waste"),
    wasteType: z.enum(WASTE_TYPES),
    weightKg: z.number().nonnegative().max(100_000),
  }),
]);

export const categoryEnum = z.enum(
  ACTIVITY_CATEGORIES as unknown as [ActivityCategory, ...ActivityCategory[]],
);

/** Human-readable list of the category-specific shapes, for prompt building. */
export const ACTIVITY_SHAPES_PROMPT = `- transport: { "category": "transport", "mode": one of [${TRANSPORT_MODES.join(
  ", ",
)}], "distanceKm": number }
- energy: { "category": "energy", "source": one of [${ENERGY_SOURCES.join(
  ", ",
)}], "amountKwh": number }
- food: { "category": "food", "food": one of [${FOOD_TYPES.join(
  ", ",
)}], "quantityKg": number }
- shopping: { "category": "shopping", "itemType": string, "amountSpentUsd": number }
- waste: { "category": "waste", "wasteType": one of [${WASTE_TYPES.join(
  ", ",
)}], "weightKg": number }`;

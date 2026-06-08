import { z } from "zod";
import type { Activity, ActivityCategory } from "@/types/activity";
import type { ParsedActivityResult } from "@/types/ai";
import { extractJson, generateText } from "./vertexClient";

const TRANSPORT_MODES = [
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

const ENERGY_SOURCES = ["grid_electricity", "natural_gas", "lpg", "renewable"] as const;
const FOOD_TYPES = ["beef", "lamb", "pork", "chicken", "fish", "dairy", "vegetables", "grains"] as const;
const WASTE_TYPES = ["landfill", "recycled", "composted"] as const;

/**
 * Discriminated-union schema mirroring `Activity`. Validating the model's
 * JSON output against this schema is what makes the parser safe to trust:
 * any field the model gets wrong (bad enum, missing number, NaN) is rejected
 * here rather than propagating into the emissions calculator or the UI.
 */
const activitySchema = z.discriminatedUnion("category", [
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

const parsedResponseSchema = z.object({
  category: z.enum(["transport", "energy", "food", "shopping", "waste"] as [ActivityCategory, ...ActivityCategory[]]),
  description: z.string().min(1).max(280),
  confidence: z.enum(["high", "medium", "low"]),
  activity: activitySchema,
});

const SYSTEM_INSTRUCTION = `You convert a short natural-language description of an everyday activity into a
structured JSON object describing its carbon-relevant attributes. Always reply with a single JSON
object and nothing else — no markdown fences, no commentary.

The JSON object must have this shape:
{
  "category": "transport" | "energy" | "food" | "shopping" | "waste",
  "description": "<a short, cleaned-up restatement of the activity>",
  "confidence": "high" | "medium" | "low",
  "activity": { ...category-specific fields, see below }
}

Category-specific "activity" shapes:
- transport: { "category": "transport", "mode": one of [${TRANSPORT_MODES.join(", ")}], "distanceKm": number }
- energy: { "category": "energy", "source": one of [${ENERGY_SOURCES.join(", ")}], "amountKwh": number }
- food: { "category": "food", "food": one of [${FOOD_TYPES.join(", ")}], "quantityKg": number }
- shopping: { "category": "shopping", "itemType": string, "amountSpentUsd": number }
- waste: { "category": "waste", "wasteType": one of [${WASTE_TYPES.join(", ")}], "weightKg": number }

If a quantity is not given, make a reasonable estimate appropriate to the activity and lower your
confidence accordingly. Never invent a category that does not fit the description.`;

export class ActivityParseError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = "ActivityParseError";
  }
}

/**
 * Parses free-text like "drove 12 km to work and grabbed a chicken sandwich"
 * into a structured, schema-validated `Activity`. Throws `ActivityParseError`
 * if the model output cannot be safely trusted.
 */
export async function parseActivityFromText(input: string): Promise<ParsedActivityResult> {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new ActivityParseError("Activity description must not be empty.");
  }
  if (trimmed.length > 500) {
    throw new ActivityParseError("Activity description is too long (max 500 characters).");
  }

  let rawText: string;
  try {
    rawText = await generateText(
      `Activity description: "${trimmed}"\n\nRespond with the JSON object only.`,
      SYSTEM_INSTRUCTION,
    );
  } catch (error) {
    throw new ActivityParseError("Failed to reach the AI service.", error);
  }

  let json: unknown;
  try {
    json = extractJson(rawText);
  } catch (error) {
    throw new ActivityParseError("AI response was not valid JSON.", error);
  }

  const parsed = parsedResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new ActivityParseError("AI response did not match the expected activity schema.", parsed.error);
  }

  if (parsed.data.category !== parsed.data.activity.category) {
    throw new ActivityParseError("AI response category mismatch between fields.");
  }

  return {
    activity: parsed.data.activity as Activity,
    description: parsed.data.description,
    confidence: parsed.data.confidence,
  };
}

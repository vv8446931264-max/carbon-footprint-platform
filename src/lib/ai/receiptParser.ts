import { z } from "zod";
import type { Activity } from "@/types/activity";
import {
  ACTIVITY_SHAPES_PROMPT,
  activitySchema,
  categoryEnum,
} from "./activitySchema";
import { extractJson, generateFromImage } from "./vertexClient";

export interface ParsedReceiptItem {
  description: string;
  confidence: "high" | "medium" | "low";
  activity: Activity;
}

export interface ReceiptParseResult {
  /** e.g. "Grocery receipt" or "Electricity bill" — for UI context. */
  sourceLabel: string | null;
  items: ParsedReceiptItem[];
}

const itemSchema = z.object({
  category: categoryEnum,
  description: z.string().min(1).max(200),
  confidence: z.enum(["high", "medium", "low"]),
  activity: activitySchema,
});

const receiptSchema = z.object({
  sourceLabel: z.string().max(120).nullish(),
  items: z.array(itemSchema).max(25),
});

const SYSTEM_INSTRUCTION = `You are a vision system for a carbon-footprint app. You are given a photo of a
receipt, utility bill, fuel slip, or similar everyday document. Extract the carbon-relevant
activities it implies and return them as structured JSON — and NOTHING else (no markdown fences,
no commentary).

Return a single JSON object shaped exactly as:
{
  "sourceLabel": "<short label for the document, e.g. 'Grocery receipt' or 'Electricity bill'>",
  "items": [
    {
      "category": "transport" | "energy" | "food" | "shopping" | "waste",
      "description": "<short restatement of the line item>",
      "confidence": "high" | "medium" | "low",
      "activity": { ...category-specific fields }
    }
  ]
}

Category-specific "activity" shapes:
${ACTIVITY_SHAPES_PROMPT}

Rules:
- Group similar line items (e.g. several vegetables) into one item where sensible.
- For grocery food items, estimate quantityKg from the line; lower confidence when unsure.
- For an electricity/gas bill, use the kWh shown (or estimate from the amount) as an energy item.
- For a fuel receipt, estimate distanceKm from litres/amount, choosing a car mode.
- Map generic non-food purchases to "shopping" with amountSpentUsd from the price.
- Only include items you can map to one of the five categories. If you cannot read the image or it
  contains no carbon-relevant activity, return {"sourceLabel": null, "items": []}.
- Never invent data that is not supported by the image. Prefer fewer, higher-confidence items.`;

export class ReceiptParseError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
    readonly userMessage: string = "We couldn't read that image. Try a clearer, well-lit photo of a single receipt or bill.",
  ) {
    super(message);
    this.name = "ReceiptParseError";
  }
}

/**
 * Parses a receipt/bill image into a list of schema-validated activities via
 * a multimodal Gemini call. Every item is validated against the same
 * `activitySchema` the text parser uses, so nothing the model hallucinates
 * reaches the emissions engine. Items that fail validation are dropped
 * individually rather than failing the whole upload.
 *
 * @param imageBase64 base64 image data WITHOUT the `data:...;base64,` prefix
 * @param mimeType    e.g. "image/jpeg" or "image/png"
 */
export async function parseReceiptImage(
  imageBase64: string,
  mimeType: string,
): Promise<ReceiptParseResult> {
  let rawText: string;
  try {
    rawText = await generateFromImage(
      imageBase64,
      mimeType,
      "Extract the carbon-relevant activities from this document as JSON.",
      SYSTEM_INSTRUCTION,
    );
  } catch (error) {
    throw new ReceiptParseError(
      "Failed to reach the AI vision service.",
      error,
      "We couldn't reach the AI service just now. Please try again in a moment.",
    );
  }

  let json: unknown;
  try {
    json = extractJson(rawText);
  } catch (error) {
    throw new ReceiptParseError(
      "AI vision response was not valid JSON.",
      error,
    );
  }

  const parsed = receiptSchema.safeParse(json);
  if (!parsed.success) {
    throw new ReceiptParseError(
      "AI vision response did not match the expected schema.",
      parsed.error,
    );
  }

  const items: ParsedReceiptItem[] = parsed.data.items
    // Defence-in-depth: drop any item whose top-level category disagrees with
    // its nested activity discriminator.
    .filter((item) => item.category === item.activity.category)
    .map((item) => ({
      description: item.description,
      confidence: item.confidence,
      activity: item.activity as Activity,
    }));

  return {
    sourceLabel: parsed.data.sourceLabel ?? null,
    items,
  };
}

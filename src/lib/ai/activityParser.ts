import { z } from "zod";
import type { ParsedActivityResult } from "@/types/ai";
import {
  ACTIVITY_SHAPES_PROMPT,
  activitySchema,
  categoryEnum,
} from "./activitySchema";
import { extractJson, generateText } from "./vertexClient";

const parsedResponseSchema = z.object({
  category: categoryEnum,
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
${ACTIVITY_SHAPES_PROMPT}

If a quantity is not given, make a reasonable estimate appropriate to the activity and lower your
confidence accordingly. Never invent a category that does not fit the description.

IMPORTANT — the output must always be exactly ONE JSON object matching ONE of the five shapes
above, even when the description mentions several things at once (e.g. a whole day's worth of
meals, or a commute plus a meal). In that case:
- Pick the single item with the largest likely carbon impact as the "activity".
- Set "confidence" to "low" or "medium" to reflect that you summarized multiple things.
- Mention the other items briefly in "description" for context, e.g.
  "largest item from 'had coffee, dal bath, veg curry, tea': dal bath (lentils & rice)".
Never reply with an array, multiple JSON objects, prose, or partial JSON.`;

const RETRY_INSTRUCTION = `Your previous reply could not be parsed as a single JSON object matching the
required schema. Reply again with ONLY one valid JSON object — no markdown fences, no arrays, no
commentary, no trailing text. If the description mentions multiple items, pick just the single one
with the largest likely carbon footprint and summarize the rest inside "description".`;

export class ActivityParseError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
    /** Safe to show directly to end users (no internal details). */
    readonly userMessage: string = 'We couldn\'t quite understand that activity. Try describing one activity at a time, e.g. "drove 10 km to work" or "had a chicken sandwich for lunch".',
  ) {
    super(message);
    this.name = "ActivityParseError";
  }
}

interface AttemptResult {
  ok: true;
  value: ParsedActivityResult;
}
interface AttemptFailure {
  ok: false;
  rawText: string;
  reason: "invalid-json" | "schema-mismatch" | "category-mismatch";
  detail: unknown;
}

async function attemptParse(
  prompt: string,
): Promise<AttemptResult | AttemptFailure> {
  const rawText = await generateText(prompt, SYSTEM_INSTRUCTION);

  let json: unknown;
  try {
    json = extractJson(rawText);
  } catch (error) {
    return { ok: false, rawText, reason: "invalid-json", detail: error };
  }

  const parsed = parsedResponseSchema.safeParse(json);
  if (!parsed.success) {
    return {
      ok: false,
      rawText,
      reason: "schema-mismatch",
      detail: parsed.error,
    };
  }

  if (parsed.data.category !== parsed.data.activity.category) {
    return {
      ok: false,
      rawText,
      reason: "category-mismatch",
      detail: null,
    };
  }

  return {
    ok: true,
    value: {
      activity: parsed.data.activity,
      description: parsed.data.description,
      confidence: parsed.data.confidence,
    },
  };
}

/**
 * Parses free-text like "drove 12 km to work and grabbed a chicken sandwich"
 * into a structured, schema-validated `Activity`. Throws `ActivityParseError`
 * if the model output cannot be safely trusted.
 *
 * Guardrails:
 *  - The system prompt explicitly tells the model how to collapse multi-item
 *    descriptions ("had coffee, dal, veg curry, tea") into a single activity
 *    instead of returning an array or prose that fails validation.
 *  - Zod schema-validates every field before it is trusted (no NaNs, no
 *    invented enum values reach the emissions calculator or UI).
 *  - If the first attempt isn't valid JSON or fails schema validation, we
 *    retry once with a corrective follow-up prompt that names the problem —
 *    this recovers the majority of transient model-formatting slips without
 *    surfacing an error to the user at all.
 *  - Only after both attempts fail do we throw, with a friendly
 *    `userMessage` safe to render directly (the raw `message` / `cause`
 *    stay server-side for logs).
 */
export async function parseActivityFromText(
  input: string,
): Promise<ParsedActivityResult> {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new ActivityParseError(
      "Activity description must not be empty.",
      undefined,
      'Type a short description of an activity first, e.g. "drove 10 km to work".',
    );
  }
  if (trimmed.length > 500) {
    throw new ActivityParseError(
      "Activity description is too long (max 500 characters).",
      undefined,
      "That description is a bit long — try summarizing it in under 500 characters.",
    );
  }

  const initialPrompt = `Activity description: "${trimmed}"\n\nRespond with the JSON object only.`;

  let attempt: AttemptResult | AttemptFailure;
  try {
    attempt = await attemptParse(initialPrompt);
  } catch (error) {
    throw new ActivityParseError(
      "Failed to reach the AI service.",
      error,
      "We couldn't reach the AI service just now. Please try again in a moment.",
    );
  }

  if (!attempt.ok) {
    // One self-correcting retry: tell the model exactly what went wrong and
    // show it its own broken output, so it can fix formatting issues
    // (arrays, prose, multi-item lists) without bothering the user.
    const correctivePrompt = `${initialPrompt}\n\nYour previous reply was:\n${attempt.rawText}\n\n${RETRY_INSTRUCTION}`;
    try {
      attempt = await attemptParse(correctivePrompt);
    } catch (error) {
      throw new ActivityParseError(
        "Failed to reach the AI service on retry.",
        error,
        "We couldn't reach the AI service just now. Please try again in a moment.",
      );
    }
  }

  if (!attempt.ok) {
    const messageByReason: Record<AttemptFailure["reason"], string> = {
      "invalid-json": "AI response was not valid JSON after a retry.",
      "schema-mismatch":
        "AI response did not match the expected activity schema after a retry.",
      "category-mismatch":
        "AI response category mismatch between fields after a retry.",
    };
    throw new ActivityParseError(
      messageByReason[attempt.reason],
      attempt.detail,
    );
  }

  return attempt.value;
}

import { z } from "zod";
import type { CoachReport, CoachReportInput } from "@/types/ai";
import { extractJson, generateText } from "./vertexClient";

const coachReportSchema = z.object({
  summary: z.string().min(1).max(400),
  encouragement: z.string().min(1).max(280),
  tips: z.array(z.string().min(1).max(220)).min(1).max(5),
});

const SYSTEM_INSTRUCTION = `You are a supportive personal carbon-footprint coach. Given a summary of a
person's recent activity emissions, write a short, encouraging, non-judgmental report. Avoid guilt-tripping
language, avoid making up statistics, and keep tips concrete and specific to the categories provided.
Write in plain, natural English with short sentences. Do not use em dashes; use periods or commas instead.

Reply with a single JSON object and nothing else (no markdown fences, no commentary), shaped exactly as:
{
  "summary": "<2-3 sentence overview of their footprint over the period>",
  "encouragement": "<1-2 sentence positive, motivating note>",
  "tips": ["<specific, actionable tip>", "..."]
}
Provide between 2 and 5 tips, each tied to one of the categories given.`;

export class CoachReportError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "CoachReportError";
  }
}

/**
 * Generates a personalized, validated coaching report from aggregated
 * (already-computed) emissions data. The model never sees raw user PII —
 * only category-level totals — which keeps the prompt minimal and safe.
 */
export async function generateCoachReport(
  input: CoachReportInput,
): Promise<CoachReport> {
  if (input.totalKgCo2e < 0 || input.periodDays <= 0) {
    throw new CoachReportError(
      "Invalid report input: totals and period must be positive.",
    );
  }

  const categorySummary = input.topCategories
    .map((entry) => `- ${entry.category}: ${entry.kgCo2e.toFixed(1)} kg CO2e`)
    .join("\n");

  const prompt = `Period: last ${input.periodDays} day(s)
Total emissions: ${input.totalKgCo2e.toFixed(1)} kg CO2e
Top contributing categories:
${categorySummary || "- (no activity logged yet)"}

Write the JSON report now.`;

  let rawText: string;
  try {
    rawText = await generateText(prompt, SYSTEM_INSTRUCTION);
  } catch (error) {
    throw new CoachReportError("Failed to reach the AI service.", error);
  }

  let json: unknown;
  try {
    json = extractJson(rawText);
  } catch (error) {
    throw new CoachReportError("AI response was not valid JSON.", error);
  }

  const parsed = coachReportSchema.safeParse(json);
  if (!parsed.success) {
    throw new CoachReportError(
      "AI response did not match the expected report schema.",
      parsed.error,
    );
  }

  return parsed.data;
}

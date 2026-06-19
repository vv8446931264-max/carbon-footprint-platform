import { z } from "zod";
import type { CoachReport, CoachReportInput } from "@/types/ai";
import { sanitizeText } from "@/lib/security/sanitize";
import { extractJson, generateText } from "./vertexClient";

const coachReportSchema = z.object({
  summary: z.string().min(1).max(400).transform(sanitizeText),
  encouragement: z.string().min(1).max(280).transform(sanitizeText),
  tips: z.array(z.string().min(1).max(220).transform(sanitizeText)).min(1).max(5),
});

const SYSTEM_INSTRUCTION = `You are a supportive carbon-footprint coach. Write a brief, encouraging report.
Keep tips specific to the categories given. Reference actual numbers from their data.
For India: mention public transport, plant-based options, local solutions.
Reply with only JSON, no commentary.`;


export class CoachReportError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
    /**
     * Safe to show directly to end users (no internal details). Mirrors the
     * `userMessage` contract on ActivityParseError / ReceiptParseError so
     * every AI route maps errors to the client the same way.
     */
    readonly userMessage: string = "We couldn't generate your coach report just now. Please try again in a moment.",
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
      undefined,
      "We couldn't generate a report from that data. Log an activity first, then try again.",
    );
  }

  const totalCategories = input.topCategories.reduce((s, c) => s + c.kgCo2e, 0);
  const categorySummary = input.topCategories
    .map((entry) => {
      const pct = totalCategories > 0 ? ((entry.kgCo2e / totalCategories) * 100).toFixed(0) : "0";
      return `- ${entry.category}: ${entry.kgCo2e.toFixed(1)} kg (${pct}%)`;
    })
    .join("\n");

  const dailyKg = input.totalKgCo2e / Math.max(input.periodDays, 1);
  const annualizedTonnes = (dailyKg * 365) / 1000;
  const targetStatus = annualizedTonnes <= 2 ? "on track" : "above target";

  const prompt = `User data (last ${input.periodDays} days):
Total: ${input.totalKgCo2e.toFixed(1)} kg CO2e
Annualized: ${annualizedTonnes.toFixed(1)} tonnes/year (Paris target: 2.0 t/yr, status: ${targetStatus})

Top categories:
${categorySummary || "(no activities logged yet)"}

Write a brief, specific report tied to these actual categories. Every tip must name a category and reference the user's numbers.`;

  let rawText: string;
  try {
    rawText = await generateText(prompt, SYSTEM_INSTRUCTION);
  } catch (error) {
    throw new CoachReportError(
      "Failed to reach the AI service.",
      error,
      "We couldn't reach the AI service just now. Please try again in a moment.",
    );
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

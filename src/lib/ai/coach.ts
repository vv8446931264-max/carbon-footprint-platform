import { z } from "zod";
import type { CoachReport, CoachReportInput } from "@/types/ai";
import { sanitizeText } from "@/lib/security/sanitize";
import { extractJson, generateText } from "./vertexClient";

const coachReportSchema = z.object({
  summary: z.string().min(1).max(400).transform(sanitizeText),
  encouragement: z.string().min(1).max(280).transform(sanitizeText),
  tips: z.array(z.string().min(1).max(220).transform(sanitizeText)).min(1).max(5),
});

const SYSTEM_INSTRUCTION = `You are a supportive personal carbon-footprint coach for users in India.
Given a summary of a person's recent activity emissions with contextual targets and trends, write a
short, encouraging, non-judgmental report. Avoid guilt-tripping language and avoid making up statistics.
Keep tips concrete, specific to the categories provided, and relevant to Indian daily life (local
transport like autos/buses/metros, Indian food choices, energy habits in Indian climate).
Write in plain, natural English with short sentences. Do not use em dashes; use periods or commas instead.

IMPORTANT RULES:
- Every tip MUST name the specific category it addresses and reference the user's actual numbers.
- Do NOT give generic advice like "try carpooling" or "eat less meat". Be specific: "Your transport
  accounts for X% of emissions. Switching your 15km commute to metro 3 days a week would save Y kg."
- Reference the Paris target (2 tonnes/year) and how the user compares.
- If the user is over target, be encouraging about progress, not alarming.
- If under target, celebrate it genuinely.

Reply with a single JSON object and nothing else (no markdown fences, no commentary), shaped exactly as:
{
  "summary": "<2-3 sentence overview referencing their annualized pace vs the 2t/yr target>",
  "encouragement": "<1-2 sentence positive, motivating note referencing their specific progress>",
  "tips": ["<specific, actionable tip naming the category and numbers>", "..."]
}
Provide between 2 and 5 tips, each tied to one of the categories given.`;

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
      return `- ${entry.category}: ${entry.kgCo2e.toFixed(1)} kg CO2e (${pct}% of total)`;
    })
    .join("\n");

  const dailyKg = input.totalKgCo2e / Math.max(input.periodDays, 1);
  const annualizedTonnes = (dailyKg * 365) / 1000;
  const overUnder = annualizedTonnes > 2 ? "over" : "under";
  const pctDiff = Math.abs(((annualizedTonnes - 2) / 2) * 100).toFixed(0);
  const topCategory = input.topCategories[0]?.category ?? "none";
  const topPct = totalCategories > 0 && input.topCategories[0]
    ? ((input.topCategories[0].kgCo2e / totalCategories) * 100).toFixed(0)
    : "0";

  const budgetLine = input.dailyBudgetKg
    ? `Daily budget: ${input.dailyBudgetKg.toFixed(1)} kg/day (current daily avg: ${dailyKg.toFixed(1)} kg/day)`
    : "";

  const memoryLine = input.previousSummary
    ? `Your previous analysis was: "${input.previousSummary}". Focus on what has changed since then.`
    : "";

  const prompt = `Period: last ${input.periodDays} day(s)
Total emissions: ${input.totalKgCo2e.toFixed(1)} kg CO2e
Annualized pace: ${annualizedTonnes.toFixed(1)} tonnes/year
Paris-aligned target: 2.0 tonnes/year (currently ${overUnder} target by ${pctDiff}%)
${budgetLine}

Top contributing categories:
${categorySummary || "- (no activity logged yet)"}

The user's TOP emission source is "${topCategory}" at ${topPct}% of total.
${memoryLine}

Write the JSON report now. Reference specific categories and percentages.
Do NOT give generic advice. Every tip MUST name the specific category it addresses.`;

  let rawText: string;
  try {
    rawText = await generateText(prompt, SYSTEM_INSTRUCTION, { temperature: 0.6 });
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

import { NextResponse } from "next/server";
import { z } from "zod";
import { CoachReportError, generateCoachReport } from "@/lib/ai/coach";
import { readJsonBody } from "@/lib/api/readJsonBody";
import { enforceRateLimit, limiters } from "@/lib/security/apiLimiter";

const requestSchema = z.object({
  totalKgCo2e: z.number().nonnegative().max(10_000_000),
  periodDays: z.number().int().positive().max(3650),
  topCategories: z
    .array(
      z.object({
        category: z.string().min(1).max(50),
        kgCo2e: z.number().nonnegative().max(10_000_000),
      }),
    )
    .max(10),
});

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, limiters.text);
  if (limited) return limited;

  // Size-capped, JSON-parsed, and Zod-validated in one shared guard.
  const body = await readJsonBody(request, requestSchema);
  if (!body.ok) return body.response;

  try {
    const report = await generateCoachReport(body.data);
    return NextResponse.json(report);
  } catch (error) {
    if (error instanceof CoachReportError) {
      // Same contract as the other AI routes: internal reason (with cause)
      // goes to the server log; only the pre-vetted, user-safe message is
      // sent to the client.
      console.warn("Coach report guardrail:", error.message, error.cause);
      return NextResponse.json({ error: error.userMessage }, { status: 422 });
    }

    console.error("Unexpected error generating coach report:", error);
    return NextResponse.json(
      { error: "Something went wrong while generating the report." },
      { status: 500 },
    );
  }
}

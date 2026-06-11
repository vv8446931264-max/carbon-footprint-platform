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
  const requestId = crypto.randomUUID();

  const limited = enforceRateLimit(request, limiters.text);
  if (limited) return limited;

  const body = await readJsonBody(request, requestSchema);
  if (!body.ok) return body.response;

  try {
    const report = await generateCoachReport(body.data);
    return NextResponse.json(report);
  } catch (error) {
    if (error instanceof CoachReportError) {
      console.warn(JSON.stringify({
        severity: "WARN", requestId, endpoint: "/api/coach",
        errorType: "CoachReportError", message: error.message,
      }));
      return NextResponse.json({ error: error.userMessage, requestId }, { status: 422 });
    }

    console.error(JSON.stringify({
      severity: "ERROR", requestId, endpoint: "/api/coach",
      errorType: "UnexpectedError", message: String(error),
    }));
    return NextResponse.json(
      { error: "Something went wrong while generating the report.", requestId },
      { status: 500 },
    );
  }
}

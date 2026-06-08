import { NextResponse } from "next/server";
import { z } from "zod";
import { CoachReportError, generateCoachReport } from "@/lib/ai/coach";

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
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const parsedRequest = requestSchema.safeParse(body);
  if (!parsedRequest.success) {
    return NextResponse.json(
      { error: "Invalid request.", details: parsedRequest.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const report = await generateCoachReport(parsedRequest.data);
    return NextResponse.json(report);
  } catch (error) {
    if (error instanceof CoachReportError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }

    console.error("Unexpected error generating coach report:", error);
    return NextResponse.json(
      { error: "Something went wrong while generating the report." },
      { status: 500 },
    );
  }
}

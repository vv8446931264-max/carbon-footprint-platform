import { NextResponse } from "next/server";
import { z } from "zod";
import {
  ActivityParseError,
  parseActivityFromText,
} from "@/lib/ai/activityParser";
import { calculateEmissionsKgCo2e } from "@/lib/emissions/calculate";
import { enforceRateLimit, limiters } from "@/lib/security/apiLimiter";

const requestSchema = z.object({
  text: z.string().min(1).max(500),
});

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, limiters.text);
  if (limited) return limited;

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
    const result = await parseActivityFromText(parsedRequest.data.text);
    const emissionsKgCo2e = calculateEmissionsKgCo2e(result.activity);

    return NextResponse.json({
      ...result,
      emissionsKgCo2e,
    });
  } catch (error) {
    if (error instanceof ActivityParseError) {
      // Log the precise internal reason (with cause) for debugging, but only
      // ever send the friendly, pre-vetted `userMessage` to the client — raw
      // model output / Zod error details should never reach the browser.
      console.warn(
        "Activity parse guardrail triggered:",
        error.message,
        error.cause,
      );
      return NextResponse.json({ error: error.userMessage }, { status: 422 });
    }

    console.error("Unexpected error parsing activity:", error);
    return NextResponse.json(
      {
        error:
          "Something went wrong on our end while parsing that activity. Please try again.",
      },
      { status: 500 },
    );
  }
}

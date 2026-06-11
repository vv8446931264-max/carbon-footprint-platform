import { NextResponse } from "next/server";
import { z } from "zod";
import {
  ActivityParseError,
  parseActivityFromText,
} from "@/lib/ai/activityParser";
import { readJsonBody } from "@/lib/api/readJsonBody";
import { calculateEmissionsKgCo2e } from "@/lib/emissions/calculate";
import { enforceRateLimit, limiters } from "@/lib/security/apiLimiter";

const requestSchema = z.object({
  text: z.string().min(1).max(500),
});

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();

  const limited = enforceRateLimit(request, limiters.text);
  if (limited) return limited;

  const body = await readJsonBody(request, requestSchema);
  if (!body.ok) return body.response;

  try {
    const result = await parseActivityFromText(body.data.text);
    const emissionsKgCo2e = calculateEmissionsKgCo2e(result.activity);

    return NextResponse.json({ ...result, emissionsKgCo2e });
  } catch (error) {
    if (error instanceof ActivityParseError) {
      console.warn(JSON.stringify({
        severity: "WARN", requestId, endpoint: "/api/parse-activity",
        errorType: "ActivityParseError", message: error.message,
      }));
      return NextResponse.json({ error: error.userMessage, requestId }, { status: 422 });
    }

    console.error(JSON.stringify({
      severity: "ERROR", requestId, endpoint: "/api/parse-activity",
      errorType: "UnexpectedError", message: String(error),
    }));
    return NextResponse.json(
      { error: "Something went wrong on our end while parsing that activity. Please try again.", requestId },
      { status: 500 },
    );
  }
}

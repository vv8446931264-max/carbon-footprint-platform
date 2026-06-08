import { NextResponse } from "next/server";
import { z } from "zod";
import { ActivityParseError, parseActivityFromText } from "@/lib/ai/activityParser";
import { calculateEmissionsKgCo2e } from "@/lib/emissions/calculate";

const requestSchema = z.object({
  text: z.string().min(1).max(500),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
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
      return NextResponse.json({ error: error.message }, { status: 422 });
    }

    console.error("Unexpected error parsing activity:", error);
    return NextResponse.json({ error: "Something went wrong while parsing the activity." }, { status: 500 });
  }
}

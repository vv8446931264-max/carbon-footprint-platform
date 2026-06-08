import { NextResponse } from "next/server";
import { z } from "zod";
import { parseReceiptImage, ReceiptParseError } from "@/lib/ai/receiptParser";
import { calculateEmissionsKgCo2e } from "@/lib/emissions/calculate";
import { estimateCostUsd } from "@/lib/emissions/cost";
import { enforceRateLimit, limiters } from "@/lib/security/apiLimiter";
import { isValidImageSignature } from "@/lib/security/imageSignature";

// ~8M base64 chars ≈ a 6 MB image — generous for a phone photo, but bounded so
// a malicious client can't push huge payloads into the vision model.
const MAX_BASE64_LENGTH = 8_000_000;

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

const requestSchema = z.object({
  imageBase64: z
    .string()
    .min(1)
    .max(MAX_BASE64_LENGTH, "Image is too large (max ~6 MB)."),
  mimeType: z.enum(ALLOWED_MIME_TYPES),
});

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, limiters.receipt);
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
      {
        error: "Invalid image upload.",
        details: parsedRequest.error.flatten(),
      },
      { status: 400 },
    );
  }

  // Verify the bytes actually match the claimed image type before spending a
  // (costly) vision call on them — blocks garbage payloads dressed up with an
  // image MIME type.
  if (
    !isValidImageSignature(
      parsedRequest.data.imageBase64,
      parsedRequest.data.mimeType,
    )
  ) {
    return NextResponse.json(
      { error: "That file doesn't look like a valid image." },
      { status: 400 },
    );
  }

  try {
    const { sourceLabel, items } = await parseReceiptImage(
      parsedRequest.data.imageBase64,
      parsedRequest.data.mimeType,
    );

    // Compute emissions + cost server-side so the client never has to trust
    // (or recompute) these figures from raw model output.
    const enriched = items.map((item) => ({
      ...item,
      emissionsKgCo2e: calculateEmissionsKgCo2e(item.activity),
      costUsd: estimateCostUsd(item.activity),
    }));

    return NextResponse.json({ sourceLabel, items: enriched });
  } catch (error) {
    if (error instanceof ReceiptParseError) {
      console.warn("Receipt parse guardrail:", error.message, error.cause);
      return NextResponse.json({ error: error.userMessage }, { status: 422 });
    }

    console.error("Unexpected error parsing receipt:", error);
    return NextResponse.json(
      { error: "Something went wrong on our end while reading that image." },
      { status: 500 },
    );
  }
}

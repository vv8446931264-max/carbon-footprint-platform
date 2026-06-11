import { NextResponse } from "next/server";
import { z } from "zod";
import { parseReceiptImage, ReceiptParseError } from "@/lib/ai/receiptParser";
import { readJsonBody } from "@/lib/api/readJsonBody";
import { calculateEmissionsKgCo2e } from "@/lib/emissions/calculate";
import { estimateCostUsd } from "@/lib/emissions/cost";
import { enforceRateLimit, limiters } from "@/lib/security/apiLimiter";
import { detectImageMimeType } from "@/lib/security/imageSignature";

// ~8M base64 chars ≈ a 6 MB image — generous for a phone photo, but bounded so
// a malicious client can't push huge payloads into the vision model.
const MAX_BASE64_LENGTH = 8_000_000;

// The JSON envelope around the base64 payload adds a little overhead; cap the
// raw body just above the largest legal payload so oversized uploads are
// refused before they are buffered or parsed.
const MAX_BODY_BYTES = 8_500_000;

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

  // Size-capped, JSON-parsed, and Zod-validated in one shared guard.
  const body = await readJsonBody(request, requestSchema, {
    maxBytes: MAX_BODY_BYTES,
    invalidMessage: "Invalid image upload.",
  });
  if (!body.ok) return body.response;

  // Detect the actual image format from magic bytes — never trust the client's
  // claimed mimeType. This also handles mis-labelled files (e.g. a WebP saved
  // with a .jpg extension) by forwarding the real format to the vision model
  // instead of rejecting the upload.
  const detectedMimeType = detectImageMimeType(body.data.imageBase64);
  if (!detectedMimeType) {
    return NextResponse.json(
      { error: "That file doesn't look like a valid image." },
      { status: 400 },
    );
  }

  try {
    const { sourceLabel, items } = await parseReceiptImage(
      body.data.imageBase64,
      detectedMimeType,
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

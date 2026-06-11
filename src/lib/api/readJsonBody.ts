import { NextResponse } from "next/server";
import { z } from "zod";

/**
 * Default cap for JSON request bodies. Routes with legitimately large
 * payloads (the receipt image upload) pass their own explicit cap.
 *
 * Why this exists: `await request.json()` happily buffers a body of ANY size
 * into memory before Zod ever sees it — a 100 MB POST would be fully read and
 * parsed just to be rejected. Checking `Content-Length` first (and the actual
 * text length as a backstop for chunked bodies) refuses oversized payloads
 * before they cost memory or CPU.
 */
export const DEFAULT_MAX_BODY_BYTES = 16 * 1024;

export type BodyResult<S extends z.ZodTypeAny> =
  | { ok: true; data: z.output<S> }
  | { ok: false; response: NextResponse };

export interface ReadJsonBodyOptions {
  /** Maximum accepted body size in bytes. */
  maxBytes?: number;
  /** Error message for a body that fails schema validation. */
  invalidMessage?: string;
}

function fail(status: number, error: string): { ok: false; response: NextResponse } {
  return { ok: false, response: NextResponse.json({ error }, { status }) };
}

/**
 * Shared request-body guard for every API route: size cap → JSON parse →
 * Zod validation, each failure mapped to the right status code (413/400)
 * with a clean, user-safe message. Replaces the parse/validate boilerplate
 * previously copy-pasted into each route handler.
 */
export async function readJsonBody<S extends z.ZodTypeAny>(
  request: Request,
  schema: S,
  options: ReadJsonBodyOptions = {},
): Promise<BodyResult<S>> {
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BODY_BYTES;

  // Cheap first line of defence: refuse before reading when the client
  // declares an oversized body.
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) {
    return fail(413, "Request body is too large.");
  }

  let text: string;
  try {
    text = await request.text();
  } catch {
    return fail(400, "Could not read the request body.");
  }

  // Backstop for chunked bodies that arrive without a Content-Length.
  if (text.length > maxBytes) {
    return fail(413, "Request body is too large.");
  }

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return fail(400, "Request body must be valid JSON.");
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: options.invalidMessage ?? "Invalid request.",
          // Expose field-level detail in development only — in production this
          // leaks schema structure to callers and aids payload crafting.
          ...(process.env.NODE_ENV === "development" && {
            details: parsed.error.flatten(),
          }),
        },
        { status: 400 },
      ),
    };
  }

  return { ok: true, data: parsed.data };
}

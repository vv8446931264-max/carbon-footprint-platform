# Engineering Rules & Conventions

**Product**: Carbon Coach  
**Version**: 1.1.0  
**Last updated**: June 2025

These rules capture non-obvious decisions that are easy to violate. They exist because the code alone doesn't explain the *why*, and violations have caused bugs in the past.

---

## 1. AI Output Is Always Untrusted

**Rule**: Never use AI model output directly. Always pass it through Zod validation before touching application state.

**Why**: Language models can return hallucinated fields, wrong enum values, out-of-range numbers, or valid-looking JSON with an inconsistent internal structure. In the past, a `category: "transport"` wrapper was returned with an inner `activity.category: "food"`, which silently assigned the wrong emission factor.

**How to apply**:
- Every `generateX()` function in `src/lib/ai/` must call `extractJson()` then validate with the appropriate Zod schema.
- On validation failure: retry once with the schema error fed back to the model.
- If it fails again: throw the typed error class (`ActivityParseError`, `ReceiptParseError`, etc.) — never return a partial object.
- `userMessage` on error classes must be safe to show directly in the UI.

---

## 2. Never Trust Client-Claimed MIME Type for Images

**Rule**: On the server, always detect the actual image format from magic bytes. Do not use the `mimeType` field from the request body for anything security-relevant.

**Why**: Browsers set `file.type` from the file extension, not the file content. A WebP image saved as `photo.jpg` passes every client-side check but has WebP magic bytes. Using the claimed type for the Vertex AI call caused "That file doesn't look like a valid image" errors that were invisible from the client side.

**How to apply**:
- In `parse-receipt/route.ts`, call `detectImageMimeType(imageBase64)` and use the returned type for the vision call.
- If `detectImageMimeType` returns `null`, respond with HTTP 400 — do not proceed to Vertex AI.
- The Zod schema still validates that `mimeType` is a valid enum (for API shape hygiene), but the server ignores the value.

---

## 3. Use `localDayKey()` for All Date Bucketing

**Rule**: Never use `new Date().toISOString().slice(0, 10)` to get "today's date". Always use `localDayKey()` from `src/lib/dates/localDay.ts`.

**Why**: `toISOString()` returns UTC. For users in IST (UTC+5:30), logging at 11pm shows as the next UTC day. This caused streak counter bugs where a log entry after 6:30pm would appear to belong to tomorrow, breaking the streak.

**How to apply**:
- `localDayKey()` uses `Intl.DateTimeFormat` with the device's locale to produce `"YYYY-MM-DD"` in the user's local timezone.
- Use it everywhere a "day" key is needed: `LogEntry.dayKey`, streak calculation, weekly trend aggregation.

---

## 4. Re-Encode Images Through Canvas Even When No Scaling Is Needed

**Rule**: In `prepareImageForUpload()`, always re-encode through canvas when the file is above `SKIP_BELOW_BYTES` (400 KB) — do not short-circuit when `scale === 1`.

**Why**: The original code had an early return: `if (scale === 1) return { base64: originalBase64, mimeType: file.type }`. This meant large images at native resolution were sent with the original (potentially WebP) bytes, while claiming `mimeType: "image/jpeg"`. The magic-byte check on the server then rejected them.

**How to apply**:
- The canvas pipeline normalises format to JPEG regardless of input type.
- Only skip the canvas step for small images (< 400 KB) where format normalisation isn't needed.

---

## 5. Rate Limiting Is Per-Instance, Not Global

**Rule**: Do not rely on the in-memory rate limiter for hard security guarantees under autoscaling.

**Why**: Cloud Run can spin up multiple instances. Each instance has its own limiter map. A caller who knows this can bypass the limit by cycling connections. The limiter is a cost-protection and abuse-deterrence measure, not a security boundary.

**How to apply**:
- Keep the limiter for its current purpose: protecting Vertex AI quota and preventing accidental loops.
- If hard per-user rate limiting is needed in future, migrate to a shared store (Cloud Memorystore / Redis). The `RateLimiter` interface is intentionally narrow to make this swap cheap.

---

## 6. Computed Emissions Always Done Server-Side

**Rule**: Never compute `emissionsKgCo2e` on the client. Always return it from the API and store the server-computed value in the log.

**Why**: Client-side calculation would mean two sources of truth (client factors.ts and any future server-side factors). Server-computed values are authoritative and can be corrected server-side without needing log migrations.

**How to apply**:
- Route handlers call `calculateEmissionsKgCo2e(activity)` before building the response.
- The client stores the returned `emissionsKgCo2e` in the `LogEntry` verbatim.
- If `calculateEmissionsKgCo2e` is ever updated, old log entries keep their original computed values (no retroactive change).

---

## 7. localStorage Entries Are Individually Validated, Not Batch-Rejected

**Rule**: When loading the log from localStorage, validate entries one at a time with Zod. Drop individual invalid entries. Never throw or clear the entire log on a single parse failure.

**Why**: A schema migration or a bug in a single entry would otherwise wipe the user's entire history. The 500-entry log is the user's only persistence layer — losing it is unrecoverable.

**How to apply**:
- `loadLog()` in `src/lib/storage/footprintLog.ts` parses the JSON array, then filters with `LogEntrySchema.safeParse()`.
- Entries that fail validation are silently dropped.
- On `QuotaExceededError` during save: truncate to 100 entries and retry once; if it fails again, log to console and surface a toast.

---

## 8. Zod Schemas Are the Single Source of Truth for AI Output Shape

**Rule**: Activity discriminated unions and receipt item shapes are defined once in `src/lib/ai/activitySchema.ts` and imported everywhere. Do not define inline schemas in route handlers.

**Why**: When the schema was duplicated (one version in the route handler, one in the parser), they drifted. The route handler had a newer field that the parser didn't validate, causing runtime errors that TypeScript couldn't catch.

**How to apply**:
- `activitySchema.ts` owns the canonical Zod union.
- `src/types/activity.ts` owns the TypeScript type (inferred from the Zod schema with `z.infer`).
- Both route handlers and parser libraries import from these files.

---

## 9. Parallel Receipt Processing Uses `Promise.allSettled`, Not `Promise.all`

**Rule**: When processing multiple uploaded files, use `Promise.allSettled()` to collect all results, then separate successes from failures.

**Why**: `Promise.all` short-circuits on the first rejection, discarding all successful results. If 4 of 5 receipts parse correctly, the user should see those 4 — not an error screen. Previously, a single bad image would silently drop all others.

**How to apply**:
- `ReceiptUpload.tsx` wraps each file in `processFile()`, gathers with `Promise.allSettled()`.
- Results with `status: "rejected"` increment `failedCount`.
- Results with `status: "fulfilled"` populate `groups`.
- Both are shown: successful receipts in cards, failures as an amber banner.

---

## 10. No Absolute File Paths in Documentation or Code Comments

**Rule**: Never reference absolute paths (e.g. `C:\Users\Admin\...`) in documentation, comments, or configuration.

**Why**: Absolute paths are machine-specific and leak developer environment details. They break on any other developer's machine and look unprofessional in a public repository.

**How to apply**:
- Use paths relative to the repository root: `src/lib/ai/activityParser.ts`.
- In docs, link to files using repo-relative paths.

# Security

Defence-in-depth for a public, AI-backed web app. Every control below is in the
codebase today.

## Secrets & authentication

- **No secrets anywhere.** Vertex AI is reached with **Application Default
  Credentials** — the Cloud Run service account's IAM role (`roles/aiplatform.user`).
  There are no API keys in the code, the client bundle, or the container.
- `.env*` is git-ignored; `.env.example` documents config with no real values.

## Input validation (trust boundaries)

- **Every API request body** is parsed with a Zod schema before use; malformed
  input returns a structured 4xx, never a crash.
- **Image uploads** are MIME-allow-listed **and magic-byte checked** (the file's
  real header, not just its declared type) and size-capped (~6 MB) before they
  reach the model.
- **localStorage is untrusted** — values read back are validated and fail closed
  (return empty) rather than throwing into the UI.

## Untrusted AI output

- Every model response is parsed against the **same Zod discriminated-union
  schema** the rest of the app uses. A hallucinated category, `NaN`, or
  out-of-range value is rejected before it can reach the calculator or the UI.
- Invalid receipt line-items are dropped individually rather than failing the
  whole batch.
- A self-correcting retry feeds a malformed response back once for repair.

## Prompt-injection hardening

All three Gemini system prompts (`activityParser.ts`, `coach.ts`,
`receiptParser.ts`) instruct the model to treat user input strictly as **data**,
and to ignore any embedded text that tries to change the rules, alter the output
format, or reveal the prompt.

## Rate limiting (budget protection)

- **Per-client** fixed-window limiter on every AI route: 20/min for text, 6/min
  for the heavier vision endpoint.
- **Global per-instance** backstop (120/min) that is *not* keyed by IP, so total
  Vertex AI spend stays capped even if a caller spoofs `X-Forwarded-For`.

## HTTP security headers (every route, set in `next.config.ts`)

| Header | Value |
|---|---|
| `Content-Security-Policy` | `default-src 'self'`; `object-src 'none'`; `frame-ancestors 'none'`; locked-down sources |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), browsing-topics=()` |
| `X-Powered-By` | removed (`poweredByHeader: false`) |

The config-based CSP keeps the home page statically renderable/CDN-cacheable; the
nonce-based alternative (and its trade-off) is documented in `ARCHITECTURE.md`.

## No injection sinks

No `dangerouslySetInnerHTML` with user-controlled content; all dynamic text is
rendered through React's escaping. No `eval`, no dynamic `Function`.

## Verify

```bash
curl -sI https://carbon-footprint-platform-1053195634368.us-central1.run.app | grep -iE "content-security|strict-transport|x-frame|x-content-type"
```

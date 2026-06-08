# Architecture

## Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Browser (React Client Components)                                         │
│  Dashboard → ActivityLogger / ReceiptUpload / GoalTracker /               │
│              CategoryBreakdown / CoachPanel / ImpactCardShare / ...        │
│       │                  │                       │                         │
│       │ POST             │ POST                  │ POST                    │
│       │ /api/parse-      │ /api/parse-receipt    │ /api/coach              │
│       │ activity         │ (image, base64)       │                         │
│       ▼                  ▼                       ▼                         │
│  ┌──────────────────────────────────────────────────────────────────────┐│
│  │ Next.js Route Handlers (server)                                       ││
│  │  1. rate-limit the client (lib/security)                              ││
│  │  2. validate request body / upload (Zod)                              ││
│  │  3. call lib/ai/* services                                            ││
│  │  4. compute emissions + cost server-side (lib/emissions)              ││
│  │  5. return typed JSON or a clean, user-safe error                     ││
│  └──────────────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────────┘
        │                      │                         │
        ▼                      ▼                         ▼
 lib/ai/activityParser   lib/ai/receiptParser      lib/ai/coach
 (text → activity)       (image → activities)      (totals → report)
        │                      │                         │
        └──────────────┬───────┴─────────────────────────┘
                       ▼                 ▲
            lib/ai/vertexClient ─────────┘  (in-memory TTL+LRU cache for text)
            (Vertex AI / Gemini via @google/genai; generateText + generateFromImage)

   Cross-cutting: next.config.ts security headers (CSP/HSTS/…) on every response;
                  lib/ai/activitySchema.ts is the single Zod contract for ALL AI output.
```

Pure domain logic (`lib/emissions/*`) sits underneath all of this and has **zero
dependencies on Next.js, React, or the network** — it's just plain TypeScript functions
operating on plain data, which is what makes it trivial to unit test and safe to reuse
anywhere (server, client, or a future CLI/report job).

## Layers and why they're separated

| Layer             | Responsibility                                                                  | Why it's isolated                                                           |
| ----------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `types/`          | Shared data shapes (`Activity`, `LoggedActivity`, AI I/O types)                 | Single source of truth; every layer agrees on the same contracts            |
| `lib/emissions/`  | Pure calculation, **cost**, aggregation, and comparison functions               | Zero I/O → trivially unit-testable, deterministic, reusable                 |
| `lib/gamification/` | Daily totals, streaks, achievement rules                                       | Pure logic; the habit-loop math is fully tested in isolation                |
| `lib/ai/`         | Vertex client + prompts + **one shared Zod schema** validating all model output | Keeps "trusting an LLM" contained to one place, behind a hard gate          |
| `lib/security/`   | Rate limiting + client-key extraction                                           | Reusable, testable guardrails decoupled from any specific route             |
| `lib/share/`      | Pure `<canvas>` drawing for the impact card                                     | Rendering logic testable with a stub context; reusable outside React        |
| `lib/storage/`    | localStorage persistence, guarded for SSR                                       | Swappable later for a real backend without touching components              |
| `app/api/*`       | HTTP boundary: rate-limit → validate → call service → shape response            | Thin; no business logic lives here                                          |
| `components/`     | Presentational + interactive UI, accessibility-first                            | Receives data via props/hooks; doesn't know about Vertex AI directly        |

## Why the AI output is never trusted blindly

`lib/ai/activitySchema.ts` is the **single source of truth** for the AI-output contract,
shared by the text parser and the receipt vision parser. Every AI service:

1. Sends a tightly-scoped prompt with an explicit JSON shape and a system instruction.
2. Extracts JSON defensively (`extractJson` handles markdown fences, stray prose, etc.).
3. Runs the result through a **Zod discriminated-union schema** that mirrors the `Activity`
   type exactly — wrong enum values, missing fields, NaNs, or out-of-range numbers are
   rejected before they can reach the emissions calculator or the UI.
4. Throws a typed error (`ActivityParseError` / `ReceiptParseError` / `CoachReportError`)
   carrying a **user-safe `userMessage`** distinct from the internal message; the route
   maps it to a clean `4xx` JSON response. Raw model output and Zod details stay in
   server logs, never the browser.

Two extra robustness measures worth calling out:

- **Self-correcting retry** (text parser): if the first response fails JSON/schema
  validation, we retry once with a corrective prompt that shows the model its own broken
  output. This recovers transient formatting slips (arrays, prose, multi-item lists) before
  the user ever sees an error.
- **Per-item drop** (receipt parser): an individual line item that fails validation is
  dropped rather than failing the whole upload — one bad row doesn't lose the rest.

## Multimodal receipt interpreter

`generateFromImage` sends the image as base64 `inlineData` plus a text instruction to
Gemini. The route (`/api/parse-receipt`) MIME-allow-lists and size-caps (~6 MB) the upload
before the model ever sees it, computes emissions + cost server-side for each extracted
item, and returns a previewable list. The image is read to base64 in the browser and is
**never persisted**.

## Security

Defence-in-depth across the request lifecycle:

- **Auth**: no API keys anywhere. Vertex AI uses Application Default Credentials locally and
  the Cloud Run service account's `roles/aiplatform.user` IAM role in production.
- **Input validation**: every request body is Zod-validated; uploads are MIME/size-bounded.
- **AI-output validation**: see above — the schema gate is the core security control for an
  app whose "input" includes untrusted model output.
- **Rate limiting** (`lib/security/rateLimit.ts`): per-client fixed-window limiter, applied
  via `enforceRateLimit`. Text routes 20/min, the heavier vision route 6/min. _Honest
  caveat_: it's in-memory and therefore per-instance on Cloud Run — a first line of defence
  against cost runaway/abuse, not a globally-strict quota. The interface is deliberately
  swap-compatible with a Redis/Memorystore backing store for strict global limits.
- **Security headers** (`next.config.ts`): `Content-Security-Policy`, `Strict-Transport-
  Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`,
  and a locked-down `Permissions-Policy` (camera/mic/geolocation off) on every response.

### CSP tradeoff and upgrade path

We use the **config-based (non-nonce) CSP** so the home page stays statically rendered and
CDN-cacheable. The cost is `'unsafe-inline'` for scripts/styles, which Next.js' inline
bootstrap and Tailwind's inline styles require without a per-request nonce. The stricter
alternative is a **nonce-based CSP in `proxy.ts`** (Next 16's renamed middleware), which
removes `'unsafe-inline'` but forces every page into dynamic rendering (no static
optimization / CDN caching, higher per-request cost). For this app's threat model — no
auth, no sensitive data, localStorage-only — the static-friendly policy plus the other
hardening headers is the right balance; the nonce path is a one-file change if requirements
tighten.

## Performance choices

- **AI response cache** (`lib/ai/cache.ts`): a TTL + LRU in-memory cache memoizes identical
  text prompts (30-min TTL, 500 entries). Re-logging the same activity returns instantly and
  spends zero Vertex AI credits. Image calls are intentionally **not** cached (poor keys,
  rarely identical).
- **Lazy singleton client**: the Vertex client is constructed once, on first AI use.
- **Standalone output**: `output: "standalone"` produces a minimal Cloud Run container;
  the page shell is static, only API routes render on demand.
- The emissions/cost engines do simple arithmetic over small arrays — the pure-function
  design makes adding `useMemo` trivial if a log ever grows large.

## Accessibility choices

- **Skip-to-content link** (WCAG 2.4.1) lets keyboard users bypass the header.
- **Reduced motion** (WCAG 2.3.3): `prefers-reduced-motion` neutralises animations/
  transitions for users with vestibular sensitivities.
- Every **chart is paired with a visually-hidden `<table>`** of the same data, so screen
  reader users aren't locked out by canvas/SVG.
- **Live regions** (`role="status"` + `aria-live="polite"`) announce loading/error/result
  states for the logger, receipt upload, and coach panel.
- All interactive elements are real `<button>`/`<input>`/`<label>` with visible focus rings
  and meet WCAG-AA contrast in light and dark themes.
- **Automated checks**: `jest-axe` runs axe-core against key components on every CI run, so
  regressions (missing labels, bad contrast, invalid ARIA) fail the build.

## Testing & CI

70+ tests (Vitest + Testing Library + jest-axe) cover the emissions/cost engines,
aggregation, gamification, storage, both AI parsers (mocked), the rate limiter, the cache,
and component accessibility. **GitHub Actions** (`.github/workflows/ci.yml`) runs
lint → test → build on every push and PR; the build is proven to succeed without real cloud
credentials (the Vertex client is lazy), so CI needs no secrets.

## Deployment

Multi-stage `Dockerfile` → Cloud Build → Cloud Run, with Vertex AI access granted via
IAM (`roles/aiplatform.user` on the Cloud Run service account) rather than a static API key.

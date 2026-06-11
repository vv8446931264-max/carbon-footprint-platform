# Technical Architecture Specification

**Product**: Carbon Coach  
**Version**: 1.1.0  
**Last updated**: June 2025

---

## 1. System Architecture

Carbon Coach is a Next.js 16 application with a static frontend shell and on-demand serverless API routes. The key design principle is **strict layer isolation**: the pure domain engine has zero framework or network dependencies, making it trivially testable and reusable.

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Browser (React 19 Client Components)                                    │
│  Dashboard → ActivityLogger / ReceiptUpload / GoalTracker / ...         │
│       │                  │                       │                        │
│       │ POST             │ POST                  │ POST                   │
│       │ /api/parse-      │ /api/parse-receipt    │ /api/coach             │
│       │ activity         │ (base64 image data)   │                        │
│       ▼                  ▼                       ▼                        │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ Next.js Route Handlers (Serverless API Boundary)                     ││
│  │  1. Rate-limit by client IP (fixed-window, per-instance)             ││
│  │  2. Cap + parse request body via readJsonBody utility                ││
│  │  3. Validate body shape with Zod                                     ││
│  │  4. Call lib/ai/* service                                            ││
│  │  5. Enrich with server-computed emissions + cost                     ││
│  │  6. Return typed JSON or user-safe error                             ││
│  └─────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
                        │
                        ▼
      ┌──────────────────────────────────────┐
      │  Pure Domain Engine (src/lib/)       │
      │  emissions/   — math & factors       │
      │  gamification/ — streaks & badges    │
      │  dates/        — timezone-safe utils │
      │  storage/      — localStorage guards │
      └──────────────────────────────────────┘
                        │
                        ▼
      ┌──────────────────────────────────────┐
      │  lib/ai/vertexClient.ts              │
      │  TTL+LRU cache · in-flight coalescing│
      │  30s / 45s timeouts                  │
      └──────────────────────────────────────┘
                        │
                        ▼
      ┌──────────────────────────────────────┐
      │  Google Vertex AI (Gemini 2.5 Flash) │
      │  Auth: Cloud Run service account IAM │
      └──────────────────────────────────────┘
```

---

## 2. Technology Stack

| Layer | Technology | Version |
| --- | --- | --- |
| Framework | Next.js (App Router) | 16.x |
| Runtime | Node.js | 20+ |
| Language | TypeScript (strict) | 5+ |
| AI Client | `@google/genai` (Vertex AI) | latest |
| AI Model | Gemini 2.5 Flash | `gemini-2.5-flash` |
| Styling | Tailwind CSS v4 + PostCSS | 4.x |
| Validation | Zod | 4+ |
| Charts | Recharts | 3+ |
| Icons | Lucide React | latest |
| Test Runner | Vitest + JSDOM | 4+ |
| Test Utils | @testing-library/react + jest-axe | latest |
| Deployment | Docker + GCP Cloud Run | — |
| CI | GitHub Actions | — |

---

## 3. Directory Layout

```
src/
├── app/
│   ├── api/
│   │   ├── coach/route.ts          # POST /api/coach
│   │   ├── parse-activity/route.ts # POST /api/parse-activity
│   │   └── parse-receipt/route.ts  # POST /api/parse-receipt
│   ├── error.tsx                   # Route-level error boundary
│   ├── global-error.tsx            # Root layout error boundary
│   ├── layout.tsx                  # HTML shell + theme IIFE
│   └── page.tsx                    # Renders <Dashboard />
├── components/                     # All React UI components
├── types/
│   ├── activity.ts                 # Activity discriminated union
│   └── ai.ts                       # AI I/O interfaces
└── lib/
    ├── ai/
    │   ├── activityParser.ts       # Text → Activity + retry logic
    │   ├── activitySchema.ts       # Shared Zod union (single source of truth)
    │   ├── cache.ts                # TTL + LRU in-memory cache
    │   ├── coach.ts                # generateCoachReport
    │   ├── receiptParser.ts        # Image → [Activity] + per-item drop
    │   └── vertexClient.ts         # Lazy singleton + timeouts + coalescing
    ├── api/
    │   └── readJsonBody.ts         # Shared size-cap + parse + Zod guard
    ├── baseline/
    │   └── estimate.ts             # 5-question estimator math
    ├── dates/
    │   └── localDay.ts             # localDayKey() — timezone-safe date string
    ├── emissions/
    │   ├── aggregate.ts            # totalEmissions, totalsByCategory
    │   ├── calculate.ts            # calculateEmissionsKgCo2e + constants
    │   ├── compare.ts              # suggestSwap — lower-carbon alternatives
    │   ├── cost.ts                 # estimateCostUsd per activity
    │   ├── factors.ts              # Emission factor tables
    │   └── trend.ts                # weeklyTrend aggregation
    ├── gamification/
    │   └── streaks.ts              # dailyTotals, currentStreak, achievements
    ├── images/
    │   └── prepareImageForUpload.ts # Client-side canvas downscaling
    ├── security/
    │   ├── apiLimiter.ts           # Rate limiter instances
    │   ├── imageSignature.ts       # detectImageMimeType (magic bytes)
    │   └── rateLimit.ts            # Fixed-window per-IP limiter
    ├── share/
    │   └── impactCard.ts           # Canvas PNG renderer
    ├── simulator/
    │   └── reductionSimulator.ts   # What-if studio logic
    ├── storage/
    │   ├── baseline.ts             # loadBaseline / saveBaseline (Zod-guarded)
    │   ├── exportLog.ts            # serializeLog → JSON string
    │   ├── footprintLog.ts         # loadLog / saveLog / appendEntry
    │   ├── goal.ts                 # loadDailyBudget / saveDailyBudget
    │   └── theme.ts                # readPreference / setPreference
    └── ui/
        └── categories.ts           # Category labels + visual tokens
```

---

## 4. API Endpoint Contracts

### 4.1. `POST /api/parse-activity`

Parses plain-text input into a structured, Zod-validated activity.

- **Body size cap**: 16 KB
- **Rate limit**: 20 requests / minute per client IP

**Request**:
```json
{ "text": "drove 18 km to office in my car" }
```

**Response 200**:
```json
{
  "activity": { "category": "transport", "mode": "car_petrol", "distanceKm": 18 },
  "description": "Drove 18 km to office in a petrol car",
  "confidence": "high",
  "emissionsKgCo2e": 3.456
}
```

**Error responses**: `400` (invalid input), `422` (AI parse failure), `429` (rate limited), `500`.

---

### 4.2. `POST /api/parse-receipt`

Processes a receipt/bill image and returns extracted line items.

- **Body size cap**: 8.5 MB
- **Rate limit**: 6 requests / minute per client IP

**Request**:
```json
{
  "imageBase64": "<raw base64, no data-URI prefix>",
  "mimeType": "image/jpeg"
}
```

The server detects the **actual** image format from magic bytes via `detectImageMimeType()`, ignoring the claimed `mimeType`. This handles mis-labelled files (e.g. a WebP saved as `.jpg`).

**Response 200**:
```json
{
  "sourceLabel": "IOCL Petrol Pump",
  "items": [
    {
      "description": "28.5 L petrol (estimated 148 km driving)",
      "confidence": "medium",
      "activity": { "category": "transport", "mode": "car_petrol", "distanceKm": 148 },
      "emissionsKgCo2e": 28.416,
      "costUsd": 36.5
    }
  ]
}
```

---

### 4.3. `POST /api/coach`

Generates a personalised coaching report from aggregated user metrics.

- **Body size cap**: 16 KB
- **Rate limit**: 20 requests / minute per client IP

**Request**:
```json
{
  "totalKgCo2e": 142.5,
  "periodDays": 30,
  "topCategories": [
    { "category": "transport", "kgCo2e": 90.0 },
    { "category": "food", "kgCo2e": 52.5 }
  ]
}
```

**Response 200**:
```json
{
  "summary": "Your transport footprint is your biggest lever — it's driving 63% of your total.",
  "encouragement": "You're logging consistently. That awareness alone puts you ahead of most.",
  "tips": [
    "Try public transit 2 days a week — it could cut your transport emissions by 30%.",
    "Swapping one red-meat meal per week for chicken saves ~1.8 kg CO₂e monthly."
  ]
}
```

---

## 5. Security Architecture

### 5.1. Request Body Guard (`readJsonBody.ts`)

All route handlers share a single utility that:
1. Checks `Content-Length` header (cheap fast-fail).
2. Reads the request stream up to `maxBytes`; returns `413` if exceeded.
3. JSON-parses the body.
4. Runs Zod validation against the route's schema.
5. Returns a discriminated union `{ ok: true; data } | { ok: false; response }`.

### 5.2. Image Validation (`imageSignature.ts`)

`detectImageMimeType(base64)` decodes the first 24 base64 characters (~18 bytes) and matches against known magic byte sequences:

| Format | Magic Bytes |
| --- | --- |
| JPEG | `FF D8 FF` |
| PNG | `89 50 4E 47 0D 0A 1A 0A` |
| WebP | `52 49 46 46 ?? ?? ?? ?? 57 45 42 50` |

Returns the detected MIME type (not the claimed one), or `null` if no match. The route uses the detected type for the Vertex AI vision call — mis-labelled files work correctly instead of being rejected.

### 5.3. Rate Limiting

Fixed-window per-client limiter in `rateLimit.ts`. Client key is extracted defensively from `X-Forwarded-For` (first non-private IP) or `x-real-ip`.

| Route | Limit |
| --- | --- |
| `/api/parse-activity` | 20 req / 60 s |
| `/api/coach` | 20 req / 60 s |
| `/api/parse-receipt` | 6 req / 60 s |

> **Known limitation**: rate limiting is in-memory and therefore per-Cloud-Run-instance. Under autoscaling, a determined caller could bypass limits by spinning up new instances. A Redis/Memorystore swap is the upgrade path — the interface is designed to be stateless for exactly this reason.

### 5.4. AI Output Validation

All model output is treated as untrusted input:
1. `extractJson()` strips markdown fences and prose before parsing.
2. Zod schema validates every field — wrong enums, NaNs, out-of-range numbers are rejected.
3. Category mismatch (top-level `category` ≠ nested `activity.category`) triggers a retry or drop.
4. Typed error classes (`ActivityParseError`, `ReceiptParseError`, `CoachReportError`) carry a `userMessage` that is safe to surface in the UI. Internal details stay in server logs.

### 5.5. HTTP Security Headers (next.config.ts)

| Header | Value |
| --- | --- |
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' 'unsafe-inline'; ...` |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |

---

## 6. Performance Architecture

### 6.1. AI Response Cache (`cache.ts`)

TTL + LRU in-memory cache for text prompts:
- **TTL**: 30 minutes
- **Max entries**: 500
- **Key**: normalised prompt string (lowercase, collapsed whitespace)
- Images are intentionally **not** cached (poor key stability, rarely identical)

### 6.2. In-Flight Request Coalescing (`vertexClient.ts`)

A `Map<string, Promise<string>>` tracks active in-flight text requests. If N concurrent callers submit the same prompt during a cache miss, only **one** Vertex AI call is made — all N callers share the same promise. Prevents cache stampede.

### 6.3. Timeouts

| Operation | Timeout |
| --- | --- |
| Text generation | 30 s |
| Vision (image) | 45 s |

### 6.4. Client-Side Image Compression

Before upload, `prepareImageForUpload()` uses the Canvas API to:
1. Decode the image with `createImageBitmap`.
2. Scale to max 1600px on the longest dimension.
3. Re-encode as JPEG at 85% quality.

Result: a 4 MB phone photo becomes ~200–400 KB — a 10–20× reduction — with no visible loss for OCR purposes.

---

## 7. Deployment

### GCP Cloud Run

```bash
gcloud run deploy carbon-footprint-platform \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GCP_PROJECT_ID=<project>,GCP_LOCATION=us-central1,GCP_GEMINI_MODEL=gemini-2.5-flash
```

The service account needs `roles/aiplatform.user`:
```bash
gcloud projects add-iam-policy-binding <project> \
  --member="serviceAccount:<sa>@<project>.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"
```

### Docker (multi-stage)

```
Stage 1 (deps)    — install production dependencies
Stage 2 (builder) — next build (standalone output)
Stage 3 (runner)  — minimal Node.js 20 Alpine image
```

Final image contains only the Next.js standalone output and public assets — no `node_modules` devDependencies.

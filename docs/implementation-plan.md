# Implementation Plan

**Product**: Carbon Coach  
**Version**: 1.1.0  
**Last updated**: June 2025

---

## Overview

Carbon Coach is implemented as a layered system where each layer has zero upward dependencies. The domain engine has no knowledge of Next.js; the AI service layer has no knowledge of React. This isolation keeps the codebase testable, predictable, and easy to extend.

The implementation is organised into five phases, each building on the previous.

---

## Phase 1: Pure Domain Layer

**Goal**: Establish the mathematical and structural foundation with zero external dependencies. Every function in this phase is a pure function that can be unit-tested with `vitest` in milliseconds.

**Deliverables**:

1. **Type System** (`src/types/activity.ts`)  
   Define the `Activity` discriminated union: `TransportActivity`, `EnergyActivity`, `FoodActivity`, `ShoppingActivity`, `WasteActivity`. The discriminant field `category` drives the calculator switch.

2. **Emission Factors** (`src/lib/emissions/factors.ts`)  
   Typed factor tables for transport (kg CO₂e/km), energy (kg CO₂e/kWh or kg), and food (kg CO₂e/serving). Sources: IPCC AR6, India CEA 2023, FAOSTAT. All factors documented inline.

3. **Emission Calculator** (`src/lib/emissions/calculate.ts`)  
   `calculateEmissionsKgCo2e(activity: Activity): number` — pure switch, no side effects. Also exports benchmark constants: `PARIS_ALIGNED_DAILY_KG`, `INDIA_URBAN_AVERAGE_ANNUAL_TONNES`.

4. **Cost Estimator** (`src/lib/emissions/cost.ts`)  
   `estimateCostUsd(activity: Activity): number | undefined` — spend-based estimate where applicable (transport, energy). Returns `undefined` for food/waste.

5. **Aggregation Utilities** (`src/lib/emissions/aggregate.ts`)  
   `totalEmissions(entries)`, `totalsByCategory(entries)` — used by charts and the coach payload.

6. **Gamification** (`src/lib/gamification/streaks.ts`)  
   `dailyTotals(entries)`, `currentStreak(entries, budget)`, `checkAchievements(entries)`. Uses `localDayKey()` for timezone safety.

7. **Date Utility** (`src/lib/dates/localDay.ts`)  
   `localDayKey(): string` — returns `"YYYY-MM-DD"` in the device's local timezone via `Intl.DateTimeFormat`. Never use `toISOString().slice(0, 10)`.

**Testing target**: 100+ unit tests covering emission factors, edge cases (zero distances, missing fields), streak logic, timezone boundaries.

---

## Phase 2: Vertex AI Service Layer & Security Gates

**Goal**: Connect user input (text and images) to Vertex AI models safely, with Zod-validated output and automatic retry.

**Deliverables**:

1. **Vertex Client** (`src/lib/ai/vertexClient.ts`)  
   Lazy singleton using `@google/genai`. Authenticated via Cloud Run service account IAM (no static API keys). Includes:
   - `generateText(prompt, systemPrompt?)` — 30s timeout
   - `generateVision(base64, mimeType, prompt)` — 45s timeout
   - TTL+LRU cache for text (30-min TTL, 500-entry max)
   - In-flight coalescing via `Map<string, Promise<string>>`

2. **Activity Schema** (`src/lib/ai/activitySchema.ts`)  
   Canonical Zod discriminated union mirroring `src/types/activity.ts`. Single source of truth for both AI output validation and TypeScript type inference.

3. **Activity Parser** (`src/lib/ai/activityParser.ts`)  
   `generateActivity(text): Promise<ParsedActivity>` — builds the Gemini prompt, calls `generateText`, strips markdown fences with `extractJson()`, validates with Zod, retries once on failure with error fed back to model.

4. **Receipt Parser** (`src/lib/ai/receiptParser.ts`)  
   `parseReceiptImage(base64, mimeType): Promise<ReceiptParseResult>` — Gemini Vision call, per-item Zod validation, invalid items dropped individually (not the whole batch).

5. **Coach Generator** (`src/lib/ai/coach.ts`)  
   `generateCoachReport(payload): Promise<CoachReport>` — India-specific system prompt, Zod-validated response.

6. **Image Validation** (`src/lib/security/imageSignature.ts`)  
   `detectImageMimeType(base64): "image/jpeg" | "image/png" | "image/webp" | null` — reads first 18 bytes, matches magic byte signatures. Used by the receipt route to detect actual format regardless of claimed type.

7. **Rate Limiter** (`src/lib/security/rateLimit.ts` + `apiLimiter.ts`)  
   Fixed-window per-IP limiter. Separate instances for text routes (20 req/min) and vision route (6 req/min).

8. **Body Guard** (`src/lib/api/readJsonBody.ts`)  
   Shared utility: size-cap, JSON parse, Zod validation → discriminated union result. Eliminates boilerplate from every route handler.

9. **Image Compressor** (`src/lib/images/prepareImageForUpload.ts`)  
   Client-side canvas pipeline: `createImageBitmap` → scale to 1600px → JPEG 85%. Always re-encodes through canvas when file > 400KB (format normalisation — see `rules.md` §4).

---

## Phase 3: Client State, Storage & Theme

**Goal**: Manage persistence, export/import, and theme with zero server involvement.

**Deliverables**:

1. **Activity Log Storage** (`src/lib/storage/footprintLog.ts`)  
   `loadLog()`, `saveLog()`, `appendEntry()`. Zod-validates each entry individually on load. 500-entry FIFO cap. `QuotaExceededError` handled with 100-entry truncation + retry.

2. **Baseline Storage** (`src/lib/storage/baseline.ts`)  
   `loadBaseline()`, `saveBaseline()`. Zod-guarded; missing or corrupt baseline returns `null` (triggers first-visit wizard).

3. **Goal Storage** (`src/lib/storage/goal.ts`)  
   `loadDailyBudget()`, `saveDailyBudget()`. Defaults to `PARIS_ALIGNED_DAILY_KG` (~5.479 kg) if not set.

4. **Export** (`src/lib/storage/exportLog.ts`)  
   `serializeLog(entries)` → UTF-8 JSON string → browser download via object URL.

5. **Theme** (`src/lib/storage/theme.ts`)  
   `readPreference()`, `setPreference()`. Theme IIFE in `layout.tsx` reads this before first paint — no flash.

---

## Phase 4: UI Component Layer

**Goal**: Build the visual interface using Tailwind CSS v4, matching the design system in `design.md`.

**Component build order** (each depends on the layer above):

```
Primitive / display
  ├─ CategoryBadge
  ├─ ConfidencePill
  └─ EmissionsValue

Charts (Recharts)
  ├─ WeeklyTrendChart
  └─ EmissionsBreakdownChart

Activity features
  ├─ ActivityLogger (text input → POST /api/parse-activity)
  ├─ ReceiptUpload (file picker → POST /api/parse-receipt, up to 5 files)
  └─ ActivityLog (renders LogEntry[], delete + export)

Tracking / goals
  ├─ DailyBudgetTracker (circular SVG arc)
  ├─ StreakCounter
  └─ AchievementBadges

Analysis
  ├─ FootprintSummary (totals vs. urban India avg + Paris target)
  ├─ BaselineEstimator (5-question wizard)
  ├─ ReductionSimulator (5 sliders, real-time projection)
  └─ CoachReport (on-demand AI report)

Sharing
  └─ ImpactCardShare (canvas PNG renderer)

Layout
  └─ Dashboard (composes all of the above)
```

---

## Phase 5: Infrastructure & CI

**Goal**: Deploy to GCP Cloud Run with full CI and HTTP security hardening.

**Deliverables**:

1. **Docker multi-stage build** (`Dockerfile`)  
   Stage 1 (deps): `npm ci --production`  
   Stage 2 (builder): `next build` (standalone output)  
   Stage 3 (runner): minimal Node.js 20 Alpine — no devDependencies in final image.

2. **Next.js security headers** (`next.config.ts`)  
   CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy.

3. **GitHub Actions CI** (`.github/workflows/ci.yml`)  
   On every push: `npm ci` → `npm run lint` → `npm run test` → `npm run build`.

4. **Cloud Run deployment**  
   `gcloud run deploy` with service account that has `roles/aiplatform.user`. No other permissions granted. `--allow-unauthenticated` for public access.

---

## Verification Checklist

Before any release, verify:

- [ ] `npm run test` passes (150+ tests, 0 failures)
- [ ] `npm run lint` — 0 errors
- [ ] `npm run build` — 0 TypeScript errors, build completes
- [ ] **Theme flash test**: load in dark mode, hard-refresh — no white flash
- [ ] **Text parse recovery**: input `"I ate [!] something 123"` — model retries and returns valid activity
- [ ] **Receipt drop test**: upload receipt with a handwritten note in corner — valid items extracted, unrecognisable items dropped
- [ ] **Multi-file upload**: upload 3 receipts simultaneously — all 3 processed in parallel, progress shown
- [ ] **Image type normalisation**: upload a WebP file renamed to `.jpg` — uploads and parses successfully
- [ ] **Streak timezone**: log an entry at 11pm IST — shows as today, not tomorrow
- [ ] **Rate limit**: send 25 rapid requests to `/api/parse-activity` — 429 returned after 20
- [ ] **Keyboard navigation**: tab through entire dashboard — every interactive element reachable, no focus traps
- [ ] **Dark mode charts**: all chart colours visible and sufficiently contrasted in dark mode
- [ ] **localStorage quota**: fill log to 500 entries — 501st entry drops oldest without error

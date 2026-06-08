# 🌱 Carbon Footprint Coach

A web platform that helps people **understand, track, and reduce** their personal carbon
footprint — built for the _[Challenge 3] Carbon Footprint Awareness Platform_ hackathon track.

**Live demo:** https://carbon-footprint-platform-1053195634368.us-central1.run.app

## What it does

- **Natural-language activity logging** — describe an activity in plain English
  ("drove 12 km to work and had a chicken sandwich") and the app uses **Vertex AI (Gemini)**
  to parse it into a structured, quantified entry. A self-correcting retry + strict schema
  validation make the parser robust to messy, multi-item input.
- **📷 Bill / receipt interpreter (multimodal)** — snap a photo of a grocery receipt, fuel
  slip, or utility bill and **Gemini Vision** extracts the carbon-relevant line items, which
  you preview (with per-item confidence) and add to your log in one tap.
- **💸 Carbon _and_ cost estimator** — every activity shows both kg CO₂e **and** estimated
  dollars, and swap suggestions quantify the money saved as well as the carbon — because
  "greener _and_ cheaper" is a far stronger nudge than guilt.
- **Transparent emissions math** — every estimate is computed by a small, pure,
  fully-unit-tested calculation engine using published emission factors (no black boxes).
- **Personal carbon coach** — generates an encouraging, personalized report with concrete,
  category-specific tips, powered by Gemini and validated against a strict schema before
  it ever reaches the UI.
- **🎯 Carbon budget, streaks & achievements** — set a daily budget, keep a streak of
  under-budget days, and unlock badges; turns a one-off number into an ongoing habit loop.
- **📲 Shareable impact card** — generate a downloadable PNG summary of your progress
  (rendered client-side on a `<canvas>`) — perfect for a LinkedIn/social post.
- **"What-if" swap suggestions** — automatically surfaces lower-carbon alternatives
  (e.g. "swap car for train") with quantified carbon **and** cash savings, in-line.
- **Accessible-by-default UI** — semantic HTML, skip-to-content link, ARIA live regions,
  keyboard-navigable controls, screen-reader-friendly chart data tables, reduced-motion
  support, and WCAG-AA color contrast — enforced by automated `jest-axe` tests.

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for how it's put together and why.

## Tech stack

- **Next.js 16 (App Router) + TypeScript + Tailwind CSS v4** — frontend & API routes in one deployable unit
- **Vertex AI / Gemini** (`@google/genai`) — natural-language parsing, multimodal receipt reading & coaching reports
- **Zod** — runtime validation of both API requests and AI-generated JSON
- **Recharts** — accessible data visualization
- **Vitest + Testing Library + jest-axe** — unit, component & automated accessibility tests
- **Docker + Cloud Run** — containerized deployment on GCP
- **GitHub Actions** — CI runs lint + tests + build on every push

## Getting started locally

```bash
npm install
cp .env.example .env.local   # then fill in your GCP project details
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

See [`.env.example`](./.env.example). The AI features require a GCP project with the
Vertex AI API enabled and Application Default Credentials configured
(`gcloud auth application-default login`), or a service account with `roles/aiplatform.user`
when deployed.

## Scripts

| Command              | What it does                      |
| -------------------- | --------------------------------- |
| `npm run dev`        | Start the dev server              |
| `npm run build`      | Production build                  |
| `npm run lint`       | Lint with ESLint                  |
| `npm test`           | Run the test suite once           |
| `npm run test:watch` | Run tests in watch mode           |
| `npm run format`     | Format the codebase with Prettier |

## Testing

The emissions engine, cost engine, aggregation, gamification, storage, AI response parsing
(text **and** receipt vision), the rate limiter, the response cache, and key UI components
all have dedicated tests — including automated accessibility checks with `jest-axe`:

```bash
npm test    # 70+ tests across 13 files
```

## Security

Defence-in-depth, appropriate for a public, AI-backed demo:

- **No secrets in code or client** — Vertex AI auth uses Application Default Credentials /
  the Cloud Run service account's IAM role. `.env*` is git-ignored.
- **Strict input validation** — every API request body is Zod-validated; image uploads are
  MIME-allow-listed and size-capped (~6 MB) before reaching the model.
- **Untrusted-AI-output validation** — all model output is parsed against the same Zod
  schema the rest of the app uses; nothing the model hallucinates reaches the calculator
  or the UI. Invalid receipt items are dropped individually rather than failing the batch.
- **Rate limiting** — per-client fixed-window limiter on every AI route (text endpoints
  20/min, the heavier vision endpoint 6/min) to protect the Vertex AI budget.
- **Security headers** — CSP, HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options:
  nosniff`, `Referrer-Policy`, and a locked-down `Permissions-Policy` on every response.

See [`ARCHITECTURE.md`](./ARCHITECTURE.md#security) for the CSP tradeoff and the upgrade
path to a nonce-based policy.

## Performance

- **AI response cache** — a TTL + LRU in-memory cache memoizes identical prompts, so
  re-logging the same activity never pays Vertex AI latency or credits twice.
- **Lazy AI client** — the Vertex client is a lazily-constructed singleton, created only
  on first AI use (fast cold starts).
- **Standalone output** — minimal container image, statically-rendered shell, on-demand
  API routes only.

## Deployment (GCP Cloud Run)

The app is containerized with a multi-stage `Dockerfile` (Next.js standalone output) and
deployed with:

```bash
gcloud run deploy carbon-footprint-platform \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GCP_PROJECT_ID=<project>,GCP_LOCATION=us-central1,GCP_GEMINI_MODEL=gemini-2.5-flash
```

The Cloud Run service account needs `roles/aiplatform.user` to call Vertex AI:

```bash
gcloud projects add-iam-policy-binding <project> \
  --member="serviceAccount:<service-account>" \
  --role="roles/aiplatform.user"
```

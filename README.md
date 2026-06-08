# 🌱 Carbon Footprint Coach

A web platform that helps people **understand, track, and reduce** their personal carbon
footprint — built for the _[Challenge 3] Carbon Footprint Awareness Platform_ hackathon track.

**Live demo:** https://carbon-footprint-platform-1053195634368.us-central1.run.app

## What it does

- **Natural-language activity logging** — describe an activity in plain English
  ("drove 12 km to work and had a chicken sandwich") and the app uses **Vertex AI (Gemini)**
  to parse it into a structured, quantified entry.
- **Transparent emissions math** — every estimate is computed by a small, pure,
  fully-unit-tested calculation engine using published emission factors (no black boxes).
- **Personal carbon coach** — generates an encouraging, personalized report with concrete,
  category-specific tips, powered by Gemini and validated against a strict schema before
  it ever reaches the UI.
- **"What-if" swap suggestions** — automatically surfaces lower-carbon alternatives
  (e.g. "swap car for train") with quantified savings, right inside the activity feed.
- **Accessible-by-default UI** — semantic HTML, ARIA live regions, keyboard-navigable
  controls, screen-reader-friendly chart data tables, and WCAG-AA color contrast.

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for how it's put together and why.

## Tech stack

- **Next.js 16 (App Router) + TypeScript + Tailwind CSS** — frontend & API routes in one deployable unit
- **Vertex AI / Gemini** (`@google/genai`) — natural-language parsing & coaching reports
- **Zod** — runtime validation of both API requests and AI-generated JSON
- **Recharts** — accessible data visualization
- **Vitest + Testing Library** — unit and component tests
- **Docker + Cloud Run** — containerized deployment on GCP

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

The core emissions-calculation engine, aggregation logic, storage layer, AI response
parsing, and key UI components all have dedicated tests:

```bash
npm test
```

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

## Security notes

- No API keys are hardcoded — Vertex AI auth uses Application Default Credentials /
  the Cloud Run service account's IAM role.
- All user input (HTTP request bodies and AI-generated JSON) is validated with Zod
  _before_ it's trusted, calculated on, or rendered.
- `.env*` files are git-ignored; `.env.example` documents required variables without secrets.

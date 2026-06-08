# Architecture

## Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│  Browser (React Client Components)                                    │
│  Dashboard → ActivityLogger / CategoryBreakdown / CoachPanel / etc.    │
│       │                              │                                 │
│       │ POST /api/parse-activity     │ POST /api/coach                 │
│       ▼                              ▼                                │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │ Next.js Route Handlers (server)                                  │ │
│  │  - validate request body (Zod)                                   │ │
│  │  - call lib/ai/* services                                        │ │
│  │  - return typed JSON or a clean error                            │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
                │                                  │
                ▼                                  ▼
   lib/ai/activityParser.ts             lib/ai/coach.ts
   (prompt, parse, validate)            (prompt, parse, validate)
                │                                  │
                └──────────────┬───────────────────┘
                               ▼
                   lib/ai/vertexClient.ts
                   (Vertex AI / Gemini via @google/genai)
```

Pure domain logic (`lib/emissions/*`) sits underneath all of this and has **zero
dependencies on Next.js, React, or the network** — it's just plain TypeScript functions
operating on plain data, which is what makes it trivial to unit test and safe to reuse
anywhere (server, client, or a future CLI/report job).

## Layers and why they're separated

| Layer            | Responsibility                                                                 | Why it's isolated                                                           |
| ---------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| `types/`         | Shared data shapes (`Activity`, `LoggedActivity`, AI I/O types)                | Single source of truth; every layer agrees on the same contracts            |
| `lib/emissions/` | Pure calculation, aggregation, and comparison functions                        | Zero I/O → trivially unit-testable, deterministic, reusable                 |
| `lib/ai/`        | Vertex AI client + prompt construction + **schema validation of model output** | Keeps "trusting an LLM" contained to one place, with a hard validation gate |
| `lib/storage/`   | localStorage persistence, guarded for SSR                                      | Swappable later for a real backend without touching components              |
| `app/api/*`      | HTTP boundary: parse request → call service → shape response                   | Thin; no business logic lives here                                          |
| `components/`    | Presentational + interactive UI, accessibility-first                           | Receives data via props/hooks; doesn't know about Vertex AI directly        |

## Why the AI output is never trusted blindly

Both `parseActivityFromText` and `generateCoachReport`:

1. Send a tightly-scoped prompt with an explicit JSON shape and a system instruction.
2. Extract JSON defensively (`extractJson` handles markdown fences, stray prose, etc.).
3. Run the result through a **Zod discriminated-union schema** that mirrors the `Activity`
   type exactly — wrong enum values, missing fields, or out-of-range numbers are rejected
   before they can reach the emissions calculator or the UI.
4. Throw a typed error (`ActivityParseError` / `CoachReportError`) that the route handler
   maps to a clean `4xx` JSON response — never a stack trace, never a 500 for a "the model
   said something weird" situation.

This is the same discipline you'd want for any third-party API whose output you don't
fully control.

## Performance choices

- The Vertex AI client is a **lazily-initialized singleton** — it's constructed once,
  on first use, so routes that don't need AI (none currently, but future ones might)
  don't pay the cost.
- `next.config.ts` uses `output: "standalone"`, producing a minimal server bundle for a
  small, fast-starting Cloud Run container.
- Heavy chart code (`recharts`) is loaded only in the client component that needs it.
- The emissions engine does simple arithmetic over small arrays — no need for memoization
  at this scale, but the pure-function design makes adding `useMemo` trivial if the log
  grows large.

## Accessibility choices

- Every chart is paired with a visually-hidden `<table>` containing the same data, so
  screen reader users get the information without relying on canvas/SVG rendering.
- Live regions (`role="status"` + `aria-live="polite"`) announce loading/error states for
  the activity logger and coach panel.
- All interactive elements are real `<button>`/`<input>` elements with visible focus rings
  (`focus-visible:ring-2`) and meet WCAG AA contrast in both light and dark themes.

## Deployment

Multi-stage `Dockerfile` → Cloud Build → Cloud Run, with Vertex AI access granted via
IAM (`roles/aiplatform.user` on the Cloud Run service account) rather than a static API key.

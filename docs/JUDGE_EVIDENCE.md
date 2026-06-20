# Evaluation Evidence Map

A direct, per-criterion index of where to find the evidence for each evaluation
parameter. Every claim below points at real, runnable code or tests in this
repository — nothing here is aspirational.

| Parameter | Where the evidence lives | One-line summary |
|---|---|---|
| **Code Quality** | [`CODE_QUALITY_STANDARDS.md`](../CODE_QUALITY_STANDARDS.md) | TypeScript strict + 4 extra compiler guards, **0** `any`, **0** `eslint-disable`, **0** `TODO`; god components split into focused modules under `dashboard/`, `landing/`, `coach/`. |
| **Security** | [`SECURITY.md`](../SECURITY.md) | No secrets (ADC only); full CSP/HSTS/frame/nosniff header set; Zod validation on every request **and** every AI output; dual-layer rate limiting; prompt-injection hardening on all 3 model prompts; magic-byte image validation. |
| **Efficiency** | [`PERFORMANCE_REPORT.md`](../PERFORMANCE_REPORT.md) | TTL + LRU response cache with in-flight request coalescing (no cache stampede); lazily-constructed AI client; deterministic O(n) emissions engine; standalone container output. |
| **Testing** | [`TESTING_STRATEGY.md`](../TESTING_STRATEGY.md) | 160 tests across 32 files (Vitest + Testing Library + jest-axe); 85% coverage thresholds enforced in CI on the logic that carries correctness/security weight. |
| **Accessibility** | [`ACCESSIBILITY_COMPLIANCE_REPORT.md`](../ACCESSIBILITY_COMPLIANCE_REPORT.md) | WCAG 2.1 AA: skip link, focus-trapped modals (2.4.3), reduced-motion support (2.3.3), verified-clean colour contrast, ARIA live regions, screen-reader chart data tables; automated `jest-axe` checks. |
| **Problem Alignment** | [`README.md`](../README.md) · [`ARCHITECTURE.md`](../ARCHITECTURE.md) | Implements the Challenge 3 "carbon coach" lifecycle — capture → quantify → reduce — for an India-contextualised persona, on Google Cloud (Vertex AI + Cloud Run). |

## How the AI pipeline is trustworthy (the core design decision)

The single most important design choice: **the AI never does arithmetic.** Its
only job is turning messy human input into a structured object, which is then
validated and handed to a deterministic engine.

```
plain text / receipt photo
        │
        ▼
  Vertex AI (Gemini 2.5 Flash)   ← parse only, never calculate
        │
        ▼
  Zod discriminated-union schema ← rejects anything malformed/hallucinated
        │                           (self-correcting retry on a slip)
        ▼
  lib/emissions/* pure engine    ← published factors, fully unit-tested
        │
        ▼
  kg CO₂e + estimated cost (USD)
```

This is why a hallucinated category, a NaN, or an out-of-range number can never
reach the user — it is rejected at the schema boundary before the calculator
ever runs.

## Google Cloud services used

| Service | Used for |
|---|---|
| **Vertex AI (Gemini 2.5 Flash)** | NL activity parsing, multimodal receipt reading, coaching reports |
| **Cloud Run** | Containerised, autoscaled hosting of the full app |
| **Cloud Build** | Builds the container from source on every `gcloud run deploy --source` |
| **Artifact Registry** | Stores the built container images |
| **IAM / Application Default Credentials** | Keyless auth to Vertex AI via the Cloud Run service account |

# Performance & Efficiency Report

How the app stays fast and cheap to run — at the network, compute, and
AI-credit level.

## AI cost & latency (the expensive resource)

The Vertex AI calls are the only slow, billable operations, so they get the most
attention:

- **TTL + LRU response cache** (`lib/ai/cache.ts`): identical prompts are
  memoised for 30 minutes, capped at 500 entries with LRU eviction. Re-logging
  the same activity never pays latency or credits twice.
- **In-flight request coalescing**: N concurrent identical prompts share a single
  pending promise instead of fanning out into N paid calls — the classic
  cache-stampede, eliminated.
- **Key normalisation**: `"Drove 10 km"`, `"drove 10 km"`, and `"drove  10 km"`
  collapse to one cache entry instead of three separate API calls.
- **Hard timeouts**: 30 s (text) / 45 s (vision) so a hung upstream call can't
  pin a Cloud Run instance — the user gets a fast, retryable error instead.

## Compute

- **Deterministic O(n) engine**: emissions and cost are simple factor lookups and
  sums over the activity list — no heavy computation, no blocking work.
- **Lazily-constructed AI client**: the Vertex client is a singleton created only
  on first AI use, so routes that don't need it pay nothing at cold start.
- **Memoised derived state**: the dashboard's metric derivation lives in
  `useDashboardMetrics` behind `useMemo`, recomputing only when entries or the
  budget change.

## Delivery

- **Next.js `standalone` output**: a minimal container with only the files the
  server needs — small image, fast Cloud Run cold starts.
- **Statically-rendered shell** with on-demand API routes; the config-based CSP
  keeps the landing page CDN-cacheable.
- **Client-side persistence** (`localStorage`): no database round-trips for the
  user's log; reads and writes are instant.

## Animation

- Framer Motion animations are GPU-friendly transforms/opacity and fully
  disabled under `prefers-reduced-motion`, so they never cost layout thrash.

## Net effect

The app does the minimum billable work possible: one Vertex AI call per *unique*
input, cached and coalesced; everything else is local, deterministic, and O(n).

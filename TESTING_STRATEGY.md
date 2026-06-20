# Testing Strategy

**160 tests across 32 files**, run with Vitest + Testing Library + jest-axe.

## What is tested, and why

The test effort is concentrated where bugs are expensive — the logic that drives
correctness, security, and money — rather than spread thinly over pixels.

| Layer | Coverage |
|---|---|
| **Emissions engine** (`lib/emissions/*`) | Pure-function unit tests for `calculate`, `cost`, `aggregate`, `compare`, `trend`, `equivalencies` — the numbers users trust. |
| **Gamification** (`lib/gamification/streaks.ts`) | Streak counting (timezone-correct, gap handling), daily totals, achievement unlocking. |
| **AI response parsing** | Text **and** receipt-vision parsers: valid output, malformed output, schema rejection, self-correcting retry. |
| **Security** | Rate limiter (per-client + global window), `readJsonBody` size limits, response cache (TTL, LRU eviction, in-flight coalescing). |
| **API routes** | `parse-activity`, `coach`, `parse-receipt` — success, validation errors, and error paths. |
| **Storage** | `footprintLog` persistence, quota-exceeded fallback, corrupt-data resilience. |
| **Components** | `RecentActivity` (search, category filter, emissions sort, pagination, clear-all confirmation, export); coach pieces; error boundaries (`error.tsx`, `global-error.tsx`). |
| **Accessibility** | `jest-axe` zero-violation checks across interactive components (form, file upload, coach cards). |

## Coverage thresholds (enforced)

`vitest.config.ts` enforces **85%** statements / **80%** branches / **85%**
functions / **85%** lines, measured against `src/lib/**` and `src/app/api/**` —
the logic that carries correctness and security weight. UI wrappers are exercised
via component + axe tests but excluded from the threshold so the number stays
meaningful rather than gamed.

## Run it

```bash
npm test               # all 160 tests
npm run test:coverage  # with the v8 coverage report + thresholds
```

CI (`.github/workflows`) runs lint + tests + build on every push.

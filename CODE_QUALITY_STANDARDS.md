# Code Quality Standards

How this codebase stays clean, readable, and maintainable. Every standard below
is enforced — by the compiler, the linter, or CI — not just aspired to.

## Language & compiler

- **TypeScript 5, `strict: true`**, plus four extra guards in `tsconfig.json`:
  `noUnusedLocals`, `noImplicitReturns`, `noFallthroughCasesInSwitch`,
  `forceConsistentCasingInFileNames`.
- **Zero `any`** in application code, **zero `eslint-disable`**, **zero `TODO`/
  `FIXME`** — verifiable with `grep -rn "any\|eslint-disable\|TODO" src`.
- ESLint (`eslint-config-next` + TypeScript rules) runs clean on every push.
- Prettier-formatted throughout for consistent style.

## Architecture

The project follows a strict dependency direction: **UI components → typed API
routes → `lib/*` services → pure domain logic.** Lower layers never import upper
ones.

- **The AI never calculates.** `lib/ai/*` only turns input into a structured
  object; `lib/emissions/*` is a pure, deterministic, fully-tested engine that
  does the math. This separation is the backbone of the whole product.
- **Pure functions where it counts.** `lib/emissions/calculate.ts`, `cost.ts`,
  `aggregate.ts`, `compare.ts`, and `gamification/streaks.ts` are side-effect
  free and individually unit-tested.
- **Typed boundaries.** Every API request body and every AI response is parsed
  through a Zod schema before it is trusted.

## Component design

Large "god components" were deliberately split into focused modules:

| Area | Before | After |
|---|---:|---|
| Dashboard | 803-line monolith | `Dashboard.tsx` (orchestrator) + `dashboard/` (Confetti, dialogs, RecentActivity) + `hooks/useDashboardMetrics.ts` |
| Landing page | 634-line file | `landing/` — one file per section + reusable `primitives.tsx`, `Particles.tsx`, typed `data.ts` |
| Coach hub | 449-line file | `coach/` — report card, swap carousel, chart, `useCoachReport` hook, pure `projection.ts` |

Each component now has a single responsibility, a named props `interface` (no
inline prop types), and TSDoc on its public export.

## Documentation

- Public domain functions, hooks, and components carry TSDoc describing intent,
  params, and return values.
- Named constants replace magic numbers (e.g. `SWAP_REDUCTION`, `PARTICLE_COUNT`,
  `PERIOD_DAYS`) with a comment explaining the value.
- `README.md` and `ARCHITECTURE.md` document the system end to end.

## Verify

```bash
npm run lint          # 0 warnings
npx tsc --noEmit      # 0 errors in app code
npm test              # 160 passing
npm run build         # production build succeeds
```

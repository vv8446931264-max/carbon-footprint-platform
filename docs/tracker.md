# Project Tracker & Known Limitations

**Product**: Carbon Coach  
**Version**: 1.1.0  
**Last updated**: June 2025

---

## 1. Shipped Features (v1.1.0)

| Feature | Status | Notes |
| --- | --- | --- |
| Baseline estimator (5-question wizard) | ✅ Shipped | Saves to localStorage |
| Natural language activity logging | ✅ Shipped | Gemini 2.5 Flash, Zod-validated |
| Multi-image receipt / bill scanner | ✅ Shipped | Up to 5 files in parallel |
| Client-side image compression | ✅ Shipped | Max 1600px, JPEG 85%, ~10–20× size reduction |
| Server-side magic-byte image validation | ✅ Shipped | Handles mis-labelled WebP/PNG/JPEG |
| Daily budget tracker (circular SVG) | ✅ Shipped | Animated arc, colour-coded |
| Weekly trend chart | ✅ Shipped | Recharts AreaChart + sr-only table |
| Emissions breakdown chart | ✅ Shipped | Recharts PieChart by category |
| Streak counter & achievements | ✅ Shipped | IST-safe via `localDayKey()` |
| AI coach report | ✅ Shipped | On-demand, India-specific tips |
| "What-If" reduction simulator | ✅ Shipped | 5 sliders, real-time projection |
| Social sharing (impact card PNG) | ✅ Shipped | Canvas renderer, client-side only |
| Dark mode (no flash) | ✅ Shipped | IIFE in layout.tsx |
| JSON data export | ✅ Shipped | One-click download |
| localStorage persistence | ✅ Shipped | 500-entry cap, Zod-validated |
| HTTP security headers | ✅ Shipped | CSP, HSTS, X-Frame-Options, etc. |
| Rate limiting (per-instance) | ✅ Shipped | 20 req/min text, 6 req/min vision |
| AI response caching (TTL + LRU) | ✅ Shipped | 30-min TTL, 500-entry max |
| In-flight request coalescing | ✅ Shipped | Prevents cache stampede |
| India-specific benchmarks | ✅ Shipped | Urban avg 4.5t, Paris target 2t |
| Accessibility (WCAG 2.1 AA) | ✅ Shipped | jest-axe CI checks |
| GCP Cloud Run deployment | ✅ Shipped | Docker multi-stage, IAM auth |

---

## 2. Known Limitations

### 2.1. Rate Limiting Is Per-Instance

**Impact**: Under Cloud Run autoscaling, the in-memory rate limiter does not enforce a global cap — each instance has its own window.

**Risk level**: Low. The limiter protects against accidental loops and casual abuse. A sophisticated attacker who triggers scale-out could bypass it.

**Upgrade path**: Replace the `Map`-backed limiter with a Cloud Memorystore (Redis) backend. The `RateLimiter` interface is narrow enough that this is a drop-in swap.

---

### 2.2. No User Authentication

**Impact**: All data is bound to the browser's localStorage. Clearing browser data or switching devices loses all history. No multi-device sync.

**Design intent**: Privacy-first — no accounts means no data breach risk for personal emissions history.

**Upgrade path**: Optional account layer with end-to-end encrypted sync (e.g. passkey auth + Firestore with client-side encryption). Tracked as a potential v2 feature.

---

### 2.3. Emission Factors Are Approximate

**Impact**: The kg CO₂e calculations are directionally accurate but not auditor-grade. Transport factors are UK DEFRA / IPCC AR6; India electricity grid factor uses CEA 2023 average (0.82 kg CO₂e/kWh).

**Design intent**: For behaviour change, precision matters less than consistency. The same factor applied every day produces a comparable trend even if the absolute value is approximate.

**Upgrade path**: Integrate IEA's India-specific sub-grid factors for more accurate regional electricity estimates. Add uncertainty ranges to the UI.

---

### 2.4. Receipt OCR Accuracy Depends on Image Quality

**Impact**: Blurry, low-contrast, or hand-written receipts may produce low-confidence extractions or dropped items. Thermal receipts that have faded perform worst.

**Mitigation already in place**: Per-item Zod validation drops invalid extractions individually. Confidence field surfaced in the UI.

**Upgrade path**: Add client-side image quality pre-check (blur detection via Laplacian variance) and warn the user before upload.

---

### 2.5. AI Parsing Is English-Centric

**Impact**: Text logging works best in English. Hindi, Hinglish, or regional language inputs may parse correctly but with lower confidence.

**Upgrade path**: Add explicit language instructions to the Gemini system prompt; test with common Hindi transliterations of food and transport terms.

---

### 2.6. No Offline Support

**Impact**: Activity logging and receipt scanning require internet (for Vertex AI). The dashboard and charts work offline (localStorage-based), but no new entries can be added.

**Upgrade path**: Queue entries locally when offline; sync when connectivity returns. Requires a lightweight background sync mechanism (Service Worker + IndexedDB).

---

### 2.7. Shopping Category Uses Spend-Based Estimates

**Impact**: Shopping emissions are estimated from spend in USD, not product-level lifecycle analysis. This is a significant approximation.

**Design rationale**: Product-level LCA data is not feasibly obtainable from a receipt. Spend-based estimates are the standard approach for personal carbon accounting tools at this level.

---

## 3. Future Work (Backlog)

Items identified from the Kiro code review (June 2025) and internal assessment:

| Item | Priority | Category |
| --- | --- | --- |
| Redis-backed global rate limiter | Medium | Security / Infrastructure |
| Offline queuing with Service Worker | Medium | Reliability |
| Data import (JSON backup restore) | Medium | Data portability |
| Hinglish / Hindi text input support | Medium | Localisation |
| Sub-grid electricity factors for India | Low | Accuracy |
| Client-side image quality pre-check | Low | UX |
| Optional encrypted account sync | Low | Privacy / UX |
| Emission factor versioning (dated snapshots) | Low | Accuracy |
| Per-category goal setting (beyond daily total) | Low | Feature |
| Notification / reminder system | Low | Engagement |

---

## 4. Testing Coverage

| Test type | Count | Tool |
| --- | --- | --- |
| Unit tests (emission calculations) | 40+ | Vitest |
| Unit tests (schema validation) | 30+ | Vitest |
| Unit tests (storage utilities) | 20+ | Vitest |
| Unit tests (gamification logic) | 15+ | Vitest |
| Component tests | 25+ | Vitest + @testing-library/react |
| Accessibility tests | 10+ | jest-axe |
| Integration tests (AI parse flow) | 10+ | Vitest (mocked Vertex) |
| **Total** | **150+** | |

CI runs on every push to `main` via GitHub Actions. All tests must pass before merge.

---

## 5. Dependency Health

| Package | Version | Notes |
| --- | --- | --- |
| `next` | 16.x | App Router; stable |
| `@google/genai` | latest | Vertex AI SDK; monitor for breaking changes |
| `zod` | 4+ | v4 API (not v3) — `z.string().min()` syntax unchanged |
| `recharts` | 3+ | No breaking changes expected |
| `lucide-react` | latest | Icon renames possible on major versions |
| `tailwindcss` | 4.x | v4 uses PostCSS; no `tailwind.config.js` |

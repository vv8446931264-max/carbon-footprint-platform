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
| Rate limiting (per-instance) | ⚠️ Partial | In-memory only — bypassed under autoscale |
| AI response caching (TTL + LRU) | ✅ Shipped | 30-min TTL, 500-entry max |
| In-flight request coalescing | ✅ Shipped | Prevents cache stampede |
| India-specific benchmarks | ✅ Shipped | Urban avg 4.5t, Paris target 2t |
| Accessibility (WCAG 2.1 AA) | ✅ Shipped | jest-axe CI checks |
| GCP Cloud Run deployment | ✅ Shipped | Docker multi-stage, IAM auth |

---

## 2. Security Assessment

> This section reflects a detailed security review (June 2025). Grades are honest — not aspirational.

| Area | Grade | Summary |
| --- | --- | --- |
| Input sanitization | **D+** | Zod validates structure, not safety. AI output stored unsanitized. |
| CORS policy | **C** | Same-origin by default (correct), but undocumented and fragile. |
| Rate limiting | **F** | Per-instance — useless against autoscaling abuse. |
| Error handling | **C+** | Typed errors exist but Zod details leak to clients in prod. |
| User input coverage | **B−** | API bodies covered; query params / headers / route params not yet validated. |

---

## 3. Known Limitations

### 3.1. Rate Limiting Is Per-Instance (Critical)

**Impact**: Cloud Run autoscales horizontally. Each new instance gets a fresh in-memory limiter. A botnet cycling IP addresses (spoofing `X-Forwarded-For`) can trigger new instances and burn the Vertex AI quota at will. Additionally, `X-Forwarded-For` is attacker-controlled and can be spoofed to rate-limit innocent IPs. Fixed-window allows bursts: 20 requests at :59 + 20 at :00 = 40 requests through in one second.

**Risk level**: High for a public production deployment with real API costs.

**Upgrade path**:
1. Add [Cloud Armor](https://cloud.google.com/armor) in front of Cloud Run for edge-level global rate limiting — this is the highest-impact, lowest-code fix.
2. Replace in-memory limiter with Redis (Upstash or Cloud Memorystore) for global sliding-window enforcement. The `RateLimiter` interface is designed for this swap.
3. Use `X-Cloud-Trace-Context` or `CF-Connecting-IP` (set by GCP's load balancer) instead of `X-Forwarded-For` for a trustworthy client key.
4. Move to token-bucket algorithm to protect against burst attacks.

---

### 3.2. AI Output Stored Without Sanitization (Critical)

**Impact**: The `description` field returned by Gemini is stored directly in localStorage and rendered in activity cards. Zod validates it as `z.string().max(280)` — any string passes. A prompt injection attack (malicious receipt content, adversarial text input) could induce Gemini to return HTML/script content. If any future code path ever uses `dangerouslySetInnerHTML`, or description is interpolated into an HTML attribute, XSS is trivially achievable.

Current reliance on React's auto-escaping is "hope React saves me" — not a security decision.

**Upgrade path**:
1. Sanitize all AI-generated string fields before storage:
   ```typescript
   import DOMPurify from 'isomorphic-dompurify';
   description: z.string().max(280).transform(val =>
     DOMPurify.sanitize(val, { ALLOWED_TAGS: [] })
   )
   ```
2. Add a character allowlist regex to the Zod schema as a second layer.
3. Add E2E tests that submit XSS payloads and assert they are never rendered as HTML.

---

### 3.3. Zod Validation Error Details Exposed in Production (High)

**Impact**: `readJsonBody.ts` returns `parsed.error.flatten()` to clients on validation failure. Attackers learn exact field names, expected types, and validation rules — useful for crafting payloads that barely pass validation.

**Upgrade path**: Strip `details` from 400 responses in production:
```typescript
...(process.env.NODE_ENV === 'development' && {
  details: parsed.error.flatten()
})
```

---

### 3.4. No Request IDs / Correlation (High)

**Impact**: When a user reports a failed receipt scan, there is no way to find their specific request in server logs. Errors are logged to stdout as unstructured text — not filterable in Cloud Logging.

**Upgrade path**:
1. Generate a `requestId = crypto.randomUUID()` per request in a Next.js middleware.
2. Include it in every log line (structured JSON format for Cloud Logging).
3. Return it to the client in error responses so users can quote it in bug reports.

---

### 3.5. CORS Policy Is Undocumented (Medium)

**Impact**: Same-origin-only CORS is the correct behaviour for this app. However, it is accidental (no code sets it explicitly) rather than intentional. If a developer ever adds `Access-Control-Allow-Origin: *` to unblock a mobile app or partner integration, the protection disappears silently and Vertex AI budget becomes publicly accessible.

**Upgrade path**: Add a `lib/security/cors.ts` module with an explicit origin allowlist (even if empty for now), and document the stance in `techspec.md`. Make the decision visible rather than implicit.

---

### 3.6. CSP Uses `unsafe-inline` (Medium)

**Impact**: `Content-Security-Policy` currently includes `'unsafe-inline'` for scripts and styles (required for Tailwind's runtime and Next.js hydration). This means any XSS vector that writes to the DOM can execute scripts.

**Upgrade path**: Next.js 13+ supports [nonce-based CSP](https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy) with static optimization. Migrating to nonces eliminates `unsafe-inline` while keeping the current rendering model.

---

### 3.7. Rate Limiting Is Per-Instance (already covered in 3.1)

### 3.8. No User Authentication

**Impact**: All data is bound to the browser's localStorage. Clearing browser data or switching devices loses all history. No multi-device sync.

**Design intent**: Privacy-first — no accounts means no data breach risk for personal emissions history.

**Upgrade path**: Optional passkey auth + end-to-end encrypted Firestore sync as a v2 feature.

---

### 3.9. Emission Factors Are Approximate

**Impact**: The kg CO₂e calculations are directionally accurate but not auditor-grade. Transport factors are IPCC AR6; India electricity grid uses CEA 2023 average (0.82 kg CO₂e/kWh) — not sub-grid.

**Design intent**: For behaviour change, consistency matters more than precision. The same factor every day produces a comparable trend.

**Upgrade path**: IEA India-specific sub-grid factors; uncertainty ranges in the UI.

---

### 3.10. Receipt OCR Depends on Image Quality

**Impact**: Blurry, faded thermal receipts produce low-confidence extractions or dropped items.

**Mitigation in place**: Per-item Zod validation drops invalid items individually.

**Upgrade path**: Client-side blur detection (Laplacian variance) with a warning before upload.

---

### 3.11. AI Parsing Is English-Centric

**Upgrade path**: Explicit Hindi/Hinglish language instructions in the Gemini system prompt.

---

### 3.12. No Offline Support

**Upgrade path**: Service Worker + IndexedDB queue; sync on reconnect.

---

### 3.13. Shopping Uses Spend-Based Emission Estimates

**Design rationale**: Product-level LCA data is not obtainable from a receipt. Industry-standard approach for personal carbon tools.

---

## 4. Future Work (Prioritized Backlog)

### Critical — Fix Before Scaling to Real Users

| Item | Category |
| --- | --- |
| Cloud Armor for global edge rate limiting | Security |
| Redis-backed sliding-window rate limiter | Security |
| Sanitize AI output before storage (DOMPurify + allowlist) | Security |
| Remove Zod error details from production 400 responses | Security |
| Add request IDs to all log lines and error responses | Observability |

### High Priority — Within 2 Weeks

| Item | Category |
| --- | --- |
| Document CORS policy explicitly (even if stance = same-origin only) | Security |
| Migrate CSP to nonce-based (remove `unsafe-inline`) | Security |
| Structured JSON error logging for Cloud Logging | Observability |
| E2E tests with XSS / adversarial payloads | Testing |
| Validate HTTP headers used in logging (log injection protection) | Security |

### Medium Priority

| Item | Category |
| --- | --- |
| Data import (JSON backup restore) | Data portability |
| Hinglish / Hindi text input support | Localisation |
| Client-side image quality pre-check | UX |
| Error monitoring integration (Sentry or equivalent) | Observability |
| Centralised query param / route param validation utilities | Security |

### Low Priority

| Item | Category |
| --- | --- |
| Sub-grid electricity factors for India | Accuracy |
| Optional encrypted account sync | Privacy / UX |
| Emission factor versioning (dated snapshots) | Accuracy |
| Per-category goal setting | Feature |
| Notification / reminder system | Engagement |
| Offline queuing with Service Worker | Reliability |

---

## 5. Testing Coverage

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
| **Missing: adversarial / security tests** | **0** | ⚠️ |

CI runs on every push to `main` via GitHub Actions.

---

## 6. Dependency Health

| Package | Version | Notes |
| --- | --- | --- |
| `next` | 16.x | App Router; stable |
| `@google/genai` | latest | Vertex AI SDK; monitor for breaking changes |
| `zod` | 4+ | v4 API — `z.string().min()` syntax unchanged |
| `recharts` | 3+ | No breaking changes expected |
| `lucide-react` | latest | Icon renames possible on major versions |
| `tailwindcss` | 4.x | v4 uses PostCSS; no `tailwind.config.js` |
| `isomorphic-dompurify` | — | **Not yet added** — required for AI output sanitization |

# Product Requirements Document (PRD)

**Product**: Carbon Coach  
**Version**: 1.1.0  
**Last updated**: June 2025

---

## 1. Product Overview & Vision

Carbon Coach is a personal carbon footprint tracking and reduction platform built for everyday users — particularly urban Indian households who are already generating 4–5 t CO₂e per year but have no simple way to see it. The core vision is to lower the friction of capturing carbon impact while providing clear, motivating, and actionable advice to help users achieve a Paris-aligned carbon pace (under 2 tonnes of CO₂e per year).

By integrating plain-language AI parsing and multi-receipt scanning via Gemini Vision, Carbon Coach eliminates the tedious spreadsheet-based logging typical of traditional carbon calculators. It frames carbon reduction around the twin incentives of cost savings and environmental stewardship.

**Live demo**: https://carbon-footprint-platform-1053195634368.us-central1.run.app

---

## 2. Target Audience & Persona

**Primary audience**: Urban Indian households and eco-conscious professionals.

**The "Eco-Conscious Everyday Citizen":**
- Wants to reduce their ecological impact but is overwhelmed by technical climate jargon and complex spreadsheets.
- Is aware that India's national average is ~2 t/year but suspects their own urban lifestyle (car, AC, flights) puts them significantly higher.
- Prefers encouragement and visible progress over guilt.
- Strongly values privacy — reluctant to sign up or share personal data.

**Core needs:**
- Quick, frictionless logging (plain-language text or snapping receipts).
- Direct translation of carbon impact into familiar metrics (cost in USD/INR, everyday equivalencies).
- Encouragement and game mechanics (streaks, badges) rather than finger-pointing.
- A relevant benchmark: the urban India average (~4.5 t/year), not a global figure that means nothing to them.

---

## 3. Core Features & Scope

### 3.1. User Onboarding & Baseline Estimation

**Requirement**: Users receive a directional estimate of their footprint in under 30 seconds on first visit.

**Specifications**:
- A 5-question multiple-choice questionnaire covering transport, diet, home energy, flights, and shopping habits.
- Live estimate recalculates as questions are answered.
- Results framed against the Paris-aligned target (2 t/yr) and the urban India average (~4.5 t/yr).
- Option to skip onboarding and start logging immediately.

### 3.2. Natural Language Logging (Text-to-Activity)

**Requirement**: Users can log activities in plain English.

**Specifications**:
- Free-text input (e.g., *"drove 18 km to office in my car"*, *"had chicken biryani for lunch"*).
- Vertex AI (Gemini) parses text into structured parameters (category, quantity, details).
- Zod schema guardrails validate every AI response before it reaches the calculator.
- Automatic self-correcting retry for model formatting errors — invisible to the user.
- One activity per entry; multi-item descriptions pick the highest-impact item and note the rest.

### 3.3. Multimodal Receipt / Bill Scanner

**Requirement**: Users can upload photos of receipts, slips, or bills to extract multiple activities at once.

**Specifications**:
- Multi-image selection — up to **5 files** processed in parallel.
- Client-side image downscaling (max 1600px, re-encoded to JPEG at 85% quality) before upload to preserve mobile bandwidth.
- Server-side magic-byte detection confirms actual image format regardless of file extension.
- Gemini Vision extracts individual line items with confidence ratings.
- Per-item Zod validation; failed items are dropped individually, not the whole batch.
- Preview UI groups results by receipt; user reviews before adding to log.

### 3.4. Habit Loop & Gamification

**Requirement**: Daily carbon budgets, streaks, and achievements keep users motivated.

**Specifications**:
- Customisable daily budget (defaults to Paris-aligned daily quota: ~5.48 kg CO₂e).
- Streak counter tracks consecutive days under budget; uses local calendar day (`localDayKey`) to correctly handle IST and other UTC+ timezones.
- Dynamic achievement badges (e.g. "First Log", "Eco Streak", "Swap Spotter") unlock automatically based on behaviour.

### 3.5. "What-If" Studio (Reduction Simulator)

**Requirement**: Interactive dashboard where users simulate the impact of lifestyle modifications.

**Specifications**:
- Sliders for Transport, Food, Energy, Shopping, and Waste (0–100% reduction).
- Real-time projection showing tonnes CO₂e saved per year and gap to Paris target.
- Populated from logged activity when available; falls back to baseline estimate.
- "Greener & cheaper" cost saving estimations shown alongside carbon savings.

### 3.6. AI Coach Report

**Requirement**: Personalised coaching report with concrete, category-specific tips.

**Specifications**:
- Generated on-demand via `POST /api/coach`.
- Gemini prompted with the user's actual top categories and total emissions.
- Response validated against a strict Zod schema before rendering.
- User-safe error messages if the AI service is unavailable.

### 3.7. Social Sharing (Impact Cards)

**Requirement**: Users can share their milestones on social channels (LinkedIn, Instagram).

**Specifications**:
- Canvas-rendered "Impact Card" summarising totals, streak, and top category.
- One-click PNG download rendered entirely client-side — no image upload to any server.

### 3.8. Private & Exportable Storage

**Requirement**: Absolute privacy with no databases or mandatory sign-up.

**Specifications**:
- Data stored locally in the browser via validated `localStorage`.
- JSON export for backup (download button in the activity log header).
- Zod-validated on load; corrupt or stale entries are dropped individually, not the whole log.
- 500-entry FIFO cap; graceful fallback to 100-entry truncation on quota errors.

---

## 4. Non-Functional Requirements

### 4.1. Performance
- **First Contentful Paint**: Under 1.5 seconds (static shell, no auth waterfall).
- **AI text parse latency**: Under 3 seconds for cached responses, under 8 seconds for new prompts.
- **Receipt scan latency**: Under 10 seconds per image (including client-side compression).
- **Cold start**: Minimal — lazy Vertex client initialization, standalone Docker output.

### 4.2. Security & Compliance
- **No static secrets**: Vertex AI authentication via Cloud Run service account IAM role only.
- **All API inputs validated**: Zod on every route; body size caps prevent unbounded buffering.
- **AI output never trusted**: Every model response validated through the same Zod schema before use.
- **Security headers**: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy on every response.

### 4.3. Accessibility (a11y)
- WCAG 2.1 Level AA target.
- Every chart paired with a visually-hidden `<table>` for screen readers.
- `prefers-reduced-motion` respected for all animations.
- `jest-axe` automated accessibility tests run on every CI push.

### 4.4. Privacy
- Zero user accounts, zero telemetry, zero server-side storage of personal data.
- Images uploaded for receipt scanning are never persisted — processed in memory and discarded.

---

## 5. Metrics & Success Criteria

| Metric | Target |
| --- | --- |
| Onboarding completion rate | > 80% of first-time visitors |
| Activities logged per session | ≥ 3 |
| Receipt scan success rate | > 90% for clearly-photographed receipts |
| Lighthouse performance score | ≥ 90 |
| Lighthouse accessibility score | ≥ 95 |
| CI test pass rate | 100% on every push |

# Application Flow

**Product**: Carbon Coach  
**Version**: 1.1.0  
**Last updated**: June 2025

---

## 1. First-Visit Flow

```
User opens app
       │
       ▼
 Has "carbon_baseline" in localStorage?
       │
  No ──┼── Yes ──────────────────────────────────────────► Dashboard (§3)
       │
       ▼
 BaselineEstimator shown
 (5-question multiple-choice wizard)
       │
  Q1: How do you commute?
  Q2: How often do you eat meat?
  Q3: What's your home energy source?
  Q4: How many flights per year?
  Q5: Monthly shopping spend?
       │
  Each answer updates live estimate in the sidebar
       │
       ▼
 User clicks "See My Footprint" or "Skip"
       │
       ▼
 Estimate saved to localStorage as BaselineEstimate
       │
       ▼
 Dashboard (§3)
```

---

## 2. Activity Logging Flows

### 2.1. Text Logging (ActivityLogger)

```
User types free text
e.g. "drove 18 km to work"
       │
       ▼
 [Log it] button pressed
       │
       ▼
 Client: prepares POST /api/parse-activity
         body: { text: "drove 18 km to work" }
       │
       ▼
 Server: readJsonBody → Zod validates body
       │
       ▼
 Server: rate limit check (20 req/min)
  → 429 if exceeded
       │
       ▼
 Server: generateActivity(text)
   → builds Gemini prompt
   → sends to Vertex AI (30s timeout)
   → receives raw JSON string
   → extractJson() strips markdown fences
   → Zod validates activity schema
   → if invalid: retry once with error fed back to model
   → if still invalid: throw ActivityParseError
       │
       ▼
 Server: calculateEmissionsKgCo2e(activity)
         estimateCostUsd(activity)
       │
       ▼
 Response 200:
   { activity, description, confidence, emissionsKgCo2e }
       │
       ▼
 Client: user sees result card with
         - emissions value
         - cost estimate
         - "Add to log" / "Discard" buttons
       │
       ▼
 "Add to log" → appendEntry(logEntry) → localStorage saved
               → streaks / achievements recalculated
               → Dashboard totals refresh
```

### 2.2. Receipt / Bill Scanner (ReceiptUpload)

```
User taps "Upload receipts" (Images icon)
       │
       ▼
 File picker opens (multiple=true, accept="image/*")
 User selects 1–5 files
       │
       ▼
 Client: for each file, prepareImageForUpload(file)
           → createImageBitmap(file)
           → canvas scale to max 1600px
           → re-encode as JPEG at 85% quality
           → returns base64 string
       │
       ▼
 Client: Promise.allSettled([processFile(f1), processFile(f2), ...])
         (all files processed in parallel)
       │
       ▼
 For each file → POST /api/parse-receipt
                 body: { imageBase64, mimeType: "image/jpeg" }
       │
       ▼
 Server: detectImageMimeType(imageBase64)
         → reads first ~18 bytes from base64
         → matches magic bytes (JPEG / PNG / WebP)
         → returns actual detected type (ignores claimed mimeType)
         → null → 400 "That file doesn't look like a valid image."
       │
       ▼
 Server: parseReceiptImage(imageBase64, detectedMimeType)
   → Gemini Vision call (45s timeout)
   → extracts merchant name + line items
   → per-item Zod validation
   → invalid items dropped individually
   → emissionsKgCo2e computed server-side for each valid item
       │
       ▼
 Client: progress bar shows "Analysed X of Y…"
       │
       ▼
 All results arrive (Promise.allSettled):
   - Successful: grouped receipt cards shown
   - Failed files: amber warning "X receipt(s) could not be read"
   - Successful receipts always shown even if others fail
       │
       ▼
 User reviews each receipt group
 Checks/unchecks individual line items
       │
       ▼
 "Add selected to log" → batch appendEntry → localStorage saved
```

---

## 3. Dashboard Flow (Returning User)

```
Page loads
       │
       ▼
 Client hydration (React 19 concurrent)
       │
       ▼
 loadLog() → reads "carbon_log" from localStorage
             → Zod validates each entry (invalid ones dropped)
             → returns LogEntry[]
       │
       ▼
 Components receive log data:
  ┌─────────────────────────────────────────────────────────┐
  │ FootprintSummary                                         │
  │  - today / 30-day / all-time totals                      │
  │  - annualised projection vs. Urban India avg (4.5t)      │
  │  - vs. Paris target (2t)                                 │
  └─────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────┐
  │ DailyBudgetTracker                                       │
  │  - animated circular SVG (today's kg vs budget)          │
  │  - current streak counter                                │
  └─────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────┐
  │ WeeklyTrendChart (Recharts AreaChart)                    │
  │  - last 7 days, bar per day                              │
  │  - budget line overlay                                   │
  │  - aria-hidden + companion <table> for screen readers    │
  └─────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────┐
  │ EmissionsBreakdownChart (Recharts PieChart)              │
  │  - category breakdown: transport / food / energy / ...   │
  └─────────────────────────────────────────────────────────┘
  ┌─────────────────────────────────────────────────────────┐
  │ ActivityLog                                              │
  │  - chronological list of LogEntry cards                  │
  │  - delete button on each                                 │
  │  - JSON export button                                    │
  └─────────────────────────────────────────────────────────┘
```

---

## 4. AI Coach Report Flow

```
User clicks "Get AI Coaching Report"
       │
       ▼
 Client aggregates:
   totalKgCo2e = sum of all log entries
   periodDays  = (now - oldest entry) in days
   topCategories = top 3 categories by kgCo2e
       │
       ▼
 POST /api/coach
       │
       ▼
 Server: rate limit (20 req/min)
       │
       ▼
 Server: generateCoachReport(payload)
   → Gemini prompt with actual user stats
   → Zod validates response
   → returns { summary, encouragement, tips }
       │
       ▼
 Client: CoachReport card appears with:
   - summary paragraph
   - 2–4 actionable tips
   - encouragement message
```

---

## 5. What-If Studio Flow

```
User opens "Reduction Simulator" tab
       │
       ▼
 ReductionSimulator receives:
   - baselineKgPerYear from log (annualised) or baseline estimate
   - current category breakdown
       │
       ▼
 Sliders rendered for 5 categories
 (Transport, Food, Energy, Shopping, Waste)
       │
       ▼
 Any slider moved →
   simulateReductions(baseline, reductions) called synchronously
   → returns projected tCO₂e/year and cost saving
   → chart and summary re-render instantly
       │
       ▼
 User sees:
   "If you reduce transport by 40%, you'd save 1.2 t/year
    and reach 3.3 t — still above the 2 t Paris target."
```

---

## 6. Social Sharing Flow

```
User clicks "Share My Impact"
       │
       ▼
 impactCard.ts draws to an offscreen <canvas>:
   - gradient background
   - total tonnes, streak, top category
   - "Carbon Coach" branding
       │
       ▼
 canvas.toBlob("image/png") → object URL created
       │
       ▼
 <a download="carbon-impact.png"> triggered programmatically
 PNG saved to device — no server involvement
```

---

## 7. Theme Toggle Flow

```
Page <head> (layout.tsx) contains an inline IIFE:
   reads localStorage["carbon_theme"]
   if "dark" → document.documentElement.classList.add("dark")
   runs before any paint → zero flash

User clicks theme toggle:
   dark → light → system → dark (cycle)
   setPreference() → updates localStorage
   classList toggled immediately
```

---

## 8. Error States

| Scenario | Shown to user |
| --- | --- |
| Invalid image (unrecognised format) | "That file doesn't look like a valid image." |
| AI parse failure after retry | "Couldn't understand that — try rephrasing" |
| Rate limit hit | "Too many requests — please wait a moment" |
| Vertex AI timeout | "AI service took too long — please try again" |
| localStorage quota exceeded | Oldest 400 entries dropped silently; toast shown |
| Partial receipt batch failure | Amber banner: "1 receipt couldn't be read; others added successfully" |

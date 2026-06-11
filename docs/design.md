# Design System & UI Guidelines

**Product**: Carbon Coach  
**Version**: 1.1.0  
**Last updated**: June 2025

---

## 1. Design Philosophy

Carbon Coach uses a calm, earthy visual identity that communicates environmental responsibility without guilt or alarm. The design intent is:

- **Clarity over decoration** — information is foregrounded; chrome is minimal.
- **Warmth** — stone and amber tones evoke soil and natural materials rather than clinical blue-and-white.
- **Encouragement** — positive framing, visible progress, celebration of small wins.
- **Accessibility first** — every visual representation has a non-visual equivalent.

---

## 2. Colour Palette

Tailwind CSS v4 semantic tokens are used throughout. Raw hex values are listed as reference only; use the Tailwind class names in code.

### 2.1. Semantic Roles

| Role | Light Mode Token | Dark Mode Token | Meaning |
| --- | --- | --- | --- |
| Surface | `stone-50` | `stone-900` | Page / card backgrounds |
| Surface elevated | `white` | `stone-800` | Raised cards, modals |
| Border | `stone-200` | `stone-700` | Dividers, outlines |
| Text primary | `stone-900` | `stone-50` | Body copy, headings |
| Text secondary | `stone-600` | `stone-400` | Labels, metadata |
| Text muted | `stone-400` | `stone-500` | Placeholders, disabled |
| Accent primary | `emerald-600` | `emerald-400` | Good / below-target indicators |
| Accent warning | `amber-600` | `amber-400` | Approaching budget / moderate |
| Accent danger | `rose-600` | `rose-400` | Over budget / high emissions |
| Accent info | `sky-600` | `sky-400` | Neutral informational |
| Brand | `emerald-700` | `emerald-500` | Logo, primary CTA buttons |

### 2.2. Category Colours

Consistent category colour mapping used in charts, badges, and log entries:

| Category | Light | Dark |
| --- | --- | --- |
| Transport | `sky-500` | `sky-400` |
| Energy | `amber-500` | `amber-400` |
| Food | `lime-500` | `lime-400` |
| Shopping | `violet-500` | `violet-400` |
| Waste | `stone-500` | `stone-400` |

---

## 3. Typography

Tailwind's default font stack (system-ui / Inter) is used — no external font downloads.

| Role | Class | Usage |
| --- | --- | --- |
| Page title | `text-2xl font-bold` | Dashboard header |
| Section heading | `text-lg font-semibold` | Card headings |
| Body | `text-sm` | Most copy |
| Caption / label | `text-xs text-stone-500` | Secondary info |
| Metric large | `text-4xl font-bold tabular-nums` | Total CO₂e, streak count |
| Metric medium | `text-2xl font-semibold tabular-nums` | Category subtotals |
| Code | `font-mono text-sm` | JSON export preview |

`tabular-nums` is applied to all numeric displays to prevent layout jitter when values update.

---

## 4. Spacing & Layout

### 4.1. Grid

The dashboard uses a 12-column CSS grid that collapses to a single column on mobile:

```
≥ 1280px (xl):  2 columns — sidebar (4 cols) + main (8 cols)
≥ 768px  (md):  2 columns — equal split
< 768px:        single column, stacked
```

### 4.2. Card Pattern

All content cards follow a consistent container:

```
rounded-2xl
bg-white dark:bg-stone-800
border border-stone-200 dark:border-stone-700
shadow-sm
p-4 sm:p-6
```

### 4.3. Spacing Scale

Use Tailwind's default 4px base-unit scale. Common values:

| Usage | Class |
| --- | --- |
| Within card, between elements | `gap-3` / `space-y-3` |
| Between cards | `gap-4` / `gap-6` |
| Horizontal padding, wide sections | `px-6` |
| Section vertical rhythm | `py-8` |

---

## 5. Component Specifications

### 5.1. DailyBudgetTracker (Circular SVG)

- Outer ring: `stone-200 dark:stone-700` (full circle)
- Progress arc: colour changes by % of daily budget used:
  - < 70%: `emerald-500`
  - 70–100%: `amber-500`
  - > 100%: `rose-500`
- Arc drawn with SVG `stroke-dasharray` / `stroke-dashoffset`
- Transition: `transition-all duration-700 ease-out`
- Respects `prefers-reduced-motion` — transition disabled when preference is set

### 5.2. WeeklyTrendChart (Recharts AreaChart)

- Area fill: `emerald-100 dark:emerald-900/30`
- Area stroke: `emerald-500`
- Daily budget reference line: dashed `amber-500`
- Axes: `stone-400` text, no grid lines (clean look)
- Tooltip: white / stone-800 card with emerald accent border
- Screen-reader companion: `<table className="sr-only">` rendered alongside

### 5.3. EmissionsBreakdownChart (Recharts PieChart)

- Uses category colour tokens from §2.2
- No legend text in the chart — legend is rendered as a separate Tailwind list below
- Outer label: percentage only, hidden at < 5% slice
- Centre label: total kg CO₂e (donut style)

### 5.4. ActivityLog Entry Card

```
flex items-start gap-3
border-b border-stone-100 dark:border-stone-700
py-3
```

Left: category colour dot (8×8px rounded-full)  
Middle: description + timestamp (text-sm + text-xs muted)  
Right: emissions value in kg + delete button (hover:text-rose-500)

### 5.5. Input & Button States

**Primary button** (Add to log, Generate Report):
```
bg-emerald-600 hover:bg-emerald-700
text-white font-medium
rounded-xl px-4 py-2
transition-colors duration-150
focus-visible:outline-2 focus-visible:outline-emerald-500
```

**Secondary / outline button**:
```
border border-stone-300 dark:border-stone-600
text-stone-700 dark:text-stone-300
hover:bg-stone-50 dark:hover:bg-stone-700
rounded-xl px-4 py-2
```

**Text input**:
```
w-full rounded-xl border border-stone-300 dark:border-stone-600
bg-white dark:bg-stone-800
px-4 py-2 text-sm
placeholder:text-stone-400
focus:outline-none focus:ring-2 focus:ring-emerald-500
```

---

## 6. Iconography

All icons use **Lucide React** (stroke-based, consistent weight). Icon sizing:

| Context | Size class |
| --- | --- |
| Button icon (with label) | `h-4 w-4` |
| Standalone action icon | `h-5 w-5` |
| Section heading icon | `h-5 w-5` |
| Empty-state illustration | `h-12 w-12 text-stone-300` |

Icons are never the sole indicator of meaning — always paired with visible text or an `aria-label`.

---

## 7. Motion & Animation

```css
/* Global: all transitions */
transition-all duration-150 ease-out

/* Progress arc */
transition-all duration-700 ease-out

/* Skeleton loaders */
animate-pulse bg-stone-200 dark:bg-stone-700

/* Badge unlock celebration */
animate-bounce (one cycle, then removed)
```

`prefers-reduced-motion` is checked in both CSS (`@media (prefers-reduced-motion: reduce)`) and in the DailyBudgetTracker SVG component to disable transitions.

---

## 8. Dark Mode

Dark mode is controlled by the `dark` class on `<html>`. The theme IIFE in `layout.tsx` reads `localStorage["carbon_theme"]` before first paint — **no flash**.

Tailwind CSS v4 variant: `dark:` prefix on all colour and shadow utilities.

Design rules for dark mode:
- Background steps down: `stone-50` → `stone-900`, `white` → `stone-800`
- All accent colours shift one step lighter (600 → 400)
- Shadows are removed or replaced with borders on dark surfaces
- Chart fills use lower opacity (e.g. `/30`) to avoid colour bleed

---

## 9. Accessibility

| Requirement | Implementation |
| --- | --- |
| WCAG 2.1 Level AA contrast | All text/background combinations verified at 4.5:1+ |
| Keyboard navigation | Every interactive element reachable by Tab; visible `:focus-visible` ring |
| Screen reader charts | `aria-hidden="true"` on SVG + `<table className="sr-only">` companion |
| Motion sensitivity | `prefers-reduced-motion` CSS media query + JS check in animated components |
| Skip navigation | `<a href="#main-content">Skip to main content</a>` at top of `<body>` |
| Form labels | Every input has a visible `<label>` or `aria-label` |
| Error states | `role="alert"` on error messages; never colour-only signalling |
| Automated CI checks | `jest-axe` runs on component mount in `accessibility.test.tsx` |

---

## 10. Responsive Breakpoints

| Breakpoint | Min width | Layout changes |
| --- | --- | --- |
| `sm` | 640px | Padding increases; cards expand to full width |
| `md` | 768px | Two-column grid activates |
| `lg` | 1024px | Sidebar fixed; main content scrolls independently |
| `xl` | 1280px | Max content width capped at `max-w-7xl` with auto margin |

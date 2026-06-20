# Accessibility Compliance Report

Target: **WCAG 2.1 Level AA**. Accessibility is built in and verified
automatically, not bolted on.

## Perceivable

- **Colour contrast** meets AA (4.5:1 for body text). The dark landing page was
  audited with a per-element contrast pass and every text element clears the
  threshold; the three originally-failing footer/badge texts were fixed.
- **No colour-only meaning**: confidence is shown with a coloured dot **and** a
  text tooltip; categories use icon + label.
- **Charts have text alternatives**: a screen-reader-friendly data table
  accompanies the visual trend chart so the data isn't locked in pixels.

## Operable

- **Skip link** ("Skip to main content") — WCAG 2.4.1 Bypass Blocks — present on
  every route with a real `#main-content` target.
- **Full keyboard support**: every control is reachable and operable by keyboard;
  visible focus rings via a global `:focus-visible` style.
- **Focus-trapped modals** — WCAG 2.4.3: `QuickLogSheet` and `ShortcutsModal`
  trap Tab/Shift+Tab inside the dialog, close on Escape, and return focus to the
  opener on close.
- **Reduced motion** — WCAG 2.3.3: all animations and smooth-scroll are
  neutralised under `prefers-reduced-motion: reduce`.

## Understandable

- Semantic HTML throughout (`<header>`, `<main>`, `<section>`, `<nav>`,
  headings in order); form inputs have associated labels.
- **ARIA live regions** announce dynamic results (filter counts, toasts) to
  screen readers with `role="status"` / `aria-live="polite"`.

## Robust

- Valid, semantic markup; ARIA used only where native semantics fall short.

## Automated verification

`jest-axe` runs zero-violation checks on the interactive surfaces (activity
form, file upload, coach cards) on every test run — so an accessibility
regression fails CI, it isn't discovered in production.

```bash
npm test   # includes the axe assertions in accessibility.test.tsx and coach.a11y.test.tsx
```

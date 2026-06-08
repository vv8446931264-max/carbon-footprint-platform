import type { BaselineAnswers } from "@/lib/baseline/estimate";

const BASELINE_STORAGE_KEY = "carbon-footprint-baseline:v1";

export interface StoredBaseline {
  answers: BaselineAnswers;
  annualTonnes: number;
  completedAt: string;
}

/**
 * Persistence for the first-run baseline estimate, mirroring the SSR-safe
 * pattern in `footprintLog.ts` / `goal.ts`. Returns null when the user hasn't
 * completed (or has skipped) the estimator, so the UI can decide whether to
 * show the onboarding card.
 */
export function loadBaseline(
  storage?: Pick<Storage, "getItem">,
): StoredBaseline | null {
  const target =
    storage ?? (typeof window === "undefined" ? null : window.localStorage);
  if (!target) return null;

  const raw = target.getItem(BASELINE_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as StoredBaseline;
    if (typeof parsed?.annualTonnes !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveBaseline(
  baseline: StoredBaseline,
  storage?: Pick<Storage, "setItem">,
): void {
  const target =
    storage ?? (typeof window === "undefined" ? null : window.localStorage);
  if (!target) return;
  target.setItem(BASELINE_STORAGE_KEY, JSON.stringify(baseline));
}

/**
 * Marks the estimator as dealt with without an estimate (the user skipped it),
 * so we don't nag them on every visit. Stored as a sentinel completedAt with a
 * zero estimate.
 */
export function skipBaseline(storage?: Pick<Storage, "setItem">): void {
  saveBaseline(
    { answers: {}, annualTonnes: 0, completedAt: new Date().toISOString() },
    storage,
  );
}

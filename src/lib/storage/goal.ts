const GOAL_STORAGE_KEY = "carbon-footprint-goal:v1";

export const DEFAULT_DAILY_BUDGET_KG = 12.9; // ~ global average annual footprint / 365

/**
 * Tiny persistence wrapper for the user's personal daily carbon budget,
 * mirroring the pattern used in `footprintLog.ts` (storage isolated from
 * components, SSR-safe, swappable for a real backend later).
 */
export function loadDailyBudget(storage?: Pick<Storage, "getItem">): number {
  const target =
    storage ?? (typeof window === "undefined" ? null : window.localStorage);
  if (!target) return DEFAULT_DAILY_BUDGET_KG;

  const raw = target.getItem(GOAL_STORAGE_KEY);
  if (!raw) return DEFAULT_DAILY_BUDGET_KG;

  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : DEFAULT_DAILY_BUDGET_KG;
}

export function saveDailyBudget(
  budgetKg: number,
  storage?: Pick<Storage, "setItem">,
): void {
  const target =
    storage ?? (typeof window === "undefined" ? null : window.localStorage);
  if (!target) return;
  if (!Number.isFinite(budgetKg) || budgetKg <= 0) return;

  target.setItem(GOAL_STORAGE_KEY, String(budgetKg));
}

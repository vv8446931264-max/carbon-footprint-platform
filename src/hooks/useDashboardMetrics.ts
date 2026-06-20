import { useMemo } from "react";
import type { LoggedActivity } from "@/types/activity";
import {
  entriesWithinDays,
  totalEmissions,
  totalsByCategory,
} from "@/lib/emissions/aggregate";
import { suggestSwap } from "@/lib/emissions/compare";
import { estimateCostUsd } from "@/lib/emissions/cost";
import { localDayKey } from "@/lib/dates/localDay";
import {
  currentStreak,
  dailyTotals,
  unlockedAchievements,
} from "@/lib/gamification/streaks";
import { CATEGORY_LABELS } from "@/lib/ui/categories";

/** Reporting window for the dashboard's headline metrics. */
export const PERIOD_DAYS = 30;

/**
 * Derives every headline metric the dashboard renders from the raw activity
 * log and the user's daily budget. Extracted from `Dashboard` so the
 * (memoized) derivation is isolated, independently testable, and keeps the
 * component focused on state and presentation.
 *
 * @param entries - The full activity log.
 * @param dailyBudgetKg - The user's daily kg CO₂e budget (drives the streak).
 * @returns Recent entries plus the period total, estimated cost, per-category
 *   breakdown, today's total, the current streak, unlocked achievements, and
 *   the top category's display label.
 */
export function useDashboardMetrics(
  entries: LoggedActivity[],
  dailyBudgetKg: number,
) {
  return useMemo(() => {
    const recent = entriesWithinDays(entries, PERIOD_DAYS);
    const sum = totalEmissions(recent);
    const cost =
      Math.round(
        recent.reduce(
          (acc, entry) => acc + estimateCostUsd(entry.activity),
          0,
        ) * 100,
      ) / 100;
    const categories = totalsByCategory(recent);

    const todayKey = localDayKey(new Date());
    const dayTotal =
      dailyTotals(entries).find((d) => d.date === todayKey)?.kgCo2e ?? 0;
    const currentStreakVal = currentStreak(entries, dailyBudgetKg);
    const swappable = entries.some(
      (entry) => suggestSwap(entry.activity) !== null,
    );
    const unlocked = unlockedAchievements({
      entryCount: entries.length,
      streak: currentStreakVal,
      hasSwappableEntry: swappable,
    });

    const topLabel = categories[0]
      ? CATEGORY_LABELS[categories[0].category]
      : null;

    return {
      recentEntries: recent,
      total: sum,
      totalCostUsd: cost,
      categoryTotals: categories,
      todayKg: dayTotal,
      streak: currentStreakVal,
      achievements: unlocked,
      topCategoryLabel: topLabel,
    };
  }, [entries, dailyBudgetKg]);
}

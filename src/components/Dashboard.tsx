"use client";

import { useEffect, useState } from "react";
import type { LoggedActivity } from "@/types/activity";
import {
  entriesWithinDays,
  totalEmissions,
  totalsByCategory,
} from "@/lib/emissions/aggregate";
import { suggestSwap } from "@/lib/emissions/compare";
import { estimateCostUsd } from "@/lib/emissions/cost";
import {
  allAchievements,
  currentStreak,
  dailyTotals,
  unlockedAchievements,
} from "@/lib/gamification/streaks";
import { appendEntry, loadLog, saveLog } from "@/lib/storage/footprintLog";
import { loadDailyBudget, saveDailyBudget } from "@/lib/storage/goal";
import { ActivityLogger } from "./ActivityLogger";
import { ActivityList } from "./ActivityList";
import { CategoryBreakdown } from "./CategoryBreakdown";
import { CoachPanel } from "./CoachPanel";
import { FootprintSummary } from "./FootprintSummary";
import { GoalTracker } from "./GoalTracker";
import { ImpactCardShare } from "./ImpactCardShare";
import { ReceiptUpload } from "./ReceiptUpload";

const PERIOD_DAYS = 30;

const CATEGORY_LABELS: Record<LoggedActivity["activity"]["category"], string> =
  {
    transport: "Transport",
    energy: "Energy",
    food: "Food",
    shopping: "Shopping",
    waste: "Waste",
  };

/**
 * Top-level client component that owns the activity log + goal state and
 * derives every view (summary, chart, streaks, coach input, share card)
 * from it. Persists to localStorage so a person's data survives reloads
 * without needing a backend for the demo.
 */
export function Dashboard() {
  // Lazy initializer runs once on the client during the first render, so the
  // log is available immediately without an extra effect-driven re-render.
  // loadLog/saveLog are no-ops on the server (guarded inside the storage module).
  const [entries, setEntries] = useState<LoggedActivity[]>(() => loadLog());
  const [dailyBudgetKg, setDailyBudgetKg] = useState<number>(() =>
    loadDailyBudget(),
  );

  useEffect(() => {
    saveLog(entries);
  }, [entries]);

  useEffect(() => {
    saveDailyBudget(dailyBudgetKg);
  }, [dailyBudgetKg]);

  function handleLog(entry: LoggedActivity) {
    setEntries((current) => appendEntry(current, entry));
  }

  function handleLogMany(newEntries: LoggedActivity[]) {
    setEntries((current) =>
      newEntries.reduce((acc, entry) => appendEntry(acc, entry), current),
    );
  }

  const recentEntries = entriesWithinDays(entries, PERIOD_DAYS);
  const total = totalEmissions(recentEntries);
  const totalCostUsd =
    Math.round(
      recentEntries.reduce(
        (sum, entry) => sum + estimateCostUsd(entry.activity),
        0,
      ) * 100,
    ) / 100;
  const categoryTotals = totalsByCategory(recentEntries);

  const todayKey = new Date().toISOString().slice(0, 10);
  const todayKg =
    dailyTotals(entries).find((d) => d.date === todayKey)?.kgCo2e ?? 0;
  const streak = currentStreak(entries, dailyBudgetKg);
  const hasSwappableEntry = entries.some(
    (entry) => suggestSwap(entry.activity) !== null,
  );
  const achievements = unlockedAchievements({
    entryCount: entries.length,
    streak,
    hasSwappableEntry,
  });

  const topCategoryLabel = categoryTotals[0]
    ? CATEGORY_LABELS[categoryTotals[0].category]
    : null;

  return (
    <div className="flex w-full max-w-4xl flex-col gap-6 px-4 py-10 sm:px-8">
      <header>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Carbon Footprint Coach
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Log everyday activities in plain language and get a personalized
          picture of your impact.
        </p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
          {achievements.length} / {allAchievements().length} achievements
          unlocked
        </p>
      </header>

      <section
        aria-labelledby="logger-heading"
        className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
      >
        <h2 id="logger-heading" className="sr-only">
          Log a new activity
        </h2>
        <ActivityLogger onLog={handleLog} />
      </section>

      <ReceiptUpload onLogMany={handleLogMany} />

      <GoalTracker
        dailyBudgetKg={dailyBudgetKg}
        onChangeBudget={setDailyBudgetKg}
        todayKg={todayKg}
        streak={streak}
        achievements={achievements}
      />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <FootprintSummary
          totalKgCo2e={total}
          periodDays={PERIOD_DAYS}
          totalCostUsd={totalCostUsd}
        />
        <CoachPanel
          totalKgCo2e={total}
          periodDays={PERIOD_DAYS}
          topCategories={categoryTotals.slice(0, 5)}
        />
      </div>

      <CategoryBreakdown totals={categoryTotals} />

      <ImpactCardShare
        data={{
          totalKgCo2e: total,
          periodDays: PERIOD_DAYS,
          streak,
          topCategoryLabel,
        }}
      />

      <section aria-labelledby="recent-heading" className="flex flex-col gap-3">
        <h2
          id="recent-heading"
          className="text-sm font-medium text-zinc-500 dark:text-zinc-400"
        >
          Recent activity
        </h2>
        <ActivityList entries={recentEntries.slice(0, 20)} />
      </section>
    </div>
  );
}

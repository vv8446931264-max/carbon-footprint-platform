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
import { CATEGORY_LABELS } from "@/lib/ui/categories";
import { ActivityLogger } from "./ActivityLogger";
import { ActivityList } from "./ActivityList";
import { AppHeader } from "./AppHeader";
import { CategoryBreakdown } from "./CategoryBreakdown";
import { CoachPanel } from "./CoachPanel";
import { FootprintSummary } from "./FootprintSummary";
import { GoalTracker } from "./GoalTracker";
import { ImpactCardShare } from "./ImpactCardShare";
import { Methodology } from "./Methodology";
import { ReceiptUpload } from "./ReceiptUpload";
import { SiteFooter } from "./SiteFooter";
import { Toast } from "./Toast";

const PERIOD_DAYS = 30;

interface ToastState {
  message: string;
  /** IDs added by the action this toast represents, so Undo can remove them. */
  undoIds: string[];
}

const cardClass =
  "rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900";

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
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    saveLog(entries);
  }, [entries]);

  useEffect(() => {
    saveDailyBudget(dailyBudgetKg);
  }, [dailyBudgetKg]);

  function handleLog(entry: LoggedActivity) {
    setEntries((current) => appendEntry(current, entry));
    setToast({
      message: `Logged “${truncate(entry.description)}”`,
      undoIds: [entry.id],
    });
  }

  function handleLogMany(newEntries: LoggedActivity[]) {
    setEntries((current) =>
      newEntries.reduce((acc, entry) => appendEntry(acc, entry), current),
    );
    setToast({
      message: `Added ${newEntries.length} ${
        newEntries.length === 1 ? "activity" : "activities"
      } from your receipt`,
      undoIds: newEntries.map((entry) => entry.id),
    });
  }

  function handleUndo() {
    if (!toast) return;
    const ids = new Set(toast.undoIds);
    setEntries((current) => current.filter((entry) => !ids.has(entry.id)));
    setToast(null);
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
    <>
      <AppHeader
        achievementsUnlocked={achievements.length}
        achievementsTotal={allAchievements().length}
      />

      <div className="flex w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-50">
            Your carbon dashboard
          </h1>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
            Log everyday activities in plain language — or scan a receipt — and
            see a clear, personalized picture of your impact.
          </p>
        </div>

        <FootprintSummary
          totalKgCo2e={total}
          periodDays={PERIOD_DAYS}
          totalCostUsd={totalCostUsd}
        />

        <section aria-labelledby="logger-heading" className={cardClass}>
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

        <CategoryBreakdown totals={categoryTotals} />

        <CoachPanel
          totalKgCo2e={total}
          periodDays={PERIOD_DAYS}
          topCategories={categoryTotals.slice(0, 5)}
        />

        <Methodology />

        <ImpactCardShare
          data={{
            totalKgCo2e: total,
            periodDays: PERIOD_DAYS,
            streak,
            topCategoryLabel,
          }}
        />

        <section
          aria-labelledby="recent-heading"
          className="flex flex-col gap-3"
        >
          <h2
            id="recent-heading"
            className="text-sm font-medium text-stone-500 dark:text-stone-400"
          >
            Recent activity
          </h2>
          <ActivityList entries={recentEntries.slice(0, 20)} />
        </section>
      </div>

      <SiteFooter />

      {toast && (
        <Toast
          message={toast.message}
          onUndo={handleUndo}
          onDismiss={() => setToast(null)}
        />
      )}
    </>
  );
}

function truncate(text: string, max = 40): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

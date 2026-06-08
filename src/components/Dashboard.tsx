"use client";

import { useEffect, useState } from "react";
import { Compass } from "lucide-react";
import type { LoggedActivity } from "@/types/activity";
import {
  entriesWithinDays,
  totalEmissions,
  totalsByCategory,
} from "@/lib/emissions/aggregate";
import { PARIS_ALIGNED_DAILY_KG } from "@/lib/emissions/calculate";
import { suggestSwap } from "@/lib/emissions/compare";
import { estimateCostUsd } from "@/lib/emissions/cost";
import { weeklyTrend } from "@/lib/emissions/trend";
import {
  allAchievements,
  currentStreak,
  dailyTotals,
  unlockedAchievements,
} from "@/lib/gamification/streaks";
import { appendEntry, loadLog, saveLog } from "@/lib/storage/footprintLog";
import {
  loadBaseline,
  saveBaseline,
  skipBaseline,
  type StoredBaseline,
} from "@/lib/storage/baseline";
import { loadDailyBudget, saveDailyBudget } from "@/lib/storage/goal";
import { CATEGORY_LABELS } from "@/lib/ui/categories";
import { ActivityLogger } from "./ActivityLogger";
import { ActivityList } from "./ActivityList";
import { AppHeader } from "./AppHeader";
import { BaselineEstimator } from "./BaselineEstimator";
import { CategoryBreakdown } from "./CategoryBreakdown";
import { CoachPanel } from "./CoachPanel";
import { FootprintSummary } from "./FootprintSummary";
import { GoalTracker } from "./GoalTracker";
import { ImpactCardShare } from "./ImpactCardShare";
import { Methodology } from "./Methodology";
import { ReceiptUpload } from "./ReceiptUpload";
import { SiteFooter } from "./SiteFooter";
import { TrendChart } from "./TrendChart";
import { Toast } from "./Toast";

const PERIOD_DAYS = 30;
const TREND_WEEKS = 8;
const WEEKLY_TARGET_KG = PARIS_ALIGNED_DAILY_KG * 7;

interface ToastState {
  message: string;
  /** IDs added by the action this toast represents, so Undo can remove them. */
  undoIds: string[];
}

const cardClass =
  "rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900";

/** Two-up responsive grid that collapses to a single column on small screens. */
const gridRow = "grid gap-6 md:grid-cols-2";

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
  const [baseline, setBaseline] = useState<StoredBaseline | null>(() =>
    loadBaseline(),
  );
  const [retaking, setRetaking] = useState(false);
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

  function handleBaselineComplete(result: StoredBaseline) {
    saveBaseline(result);
    setBaseline(result);
    setRetaking(false);
    setToast({
      message: `Baseline set: ≈ ${result.annualTonnes.toFixed(1)} t/yr`,
      undoIds: [],
    });
  }

  function handleBaselineSkip() {
    skipBaseline();
    setBaseline(loadBaseline());
    setRetaking(false);
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
  const trend = weeklyTrend(entries, TREND_WEEKS);

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

  // Show the estimator on first visit (no stored baseline) or when re-taking.
  const showEstimator = baseline === null || retaking;
  const hasSavedEstimate = baseline !== null && baseline.annualTonnes > 0;

  return (
    <>
      <AppHeader
        achievementsUnlocked={achievements.length}
        achievementsTotal={allAchievements().length}
      />

      <div className="flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-50">
            Your carbon dashboard
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-stone-600 dark:text-stone-400">
            Log everyday activities in plain language — or scan a receipt — and
            see a clear, personalized picture of your impact.
          </p>
        </div>

        {showEstimator ? (
          <BaselineEstimator
            onComplete={handleBaselineComplete}
            onSkip={handleBaselineSkip}
          />
        ) : (
          hasSavedEstimate && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 px-5 py-3 text-sm dark:border-emerald-900/50 dark:bg-emerald-950/20">
              <p className="flex items-center gap-2 text-stone-700 dark:text-stone-200">
                <Compass
                  className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                  aria-hidden="true"
                />
                Your estimated baseline is{" "}
                <strong className="tabular-nums">
                  ≈ {baseline.annualTonnes.toFixed(1)} t/yr
                </strong>
                . Keep logging to track the real number.
              </p>
              <button
                type="button"
                onClick={() => setRetaking(true)}
                className="shrink-0 rounded-lg border border-emerald-300 px-3 py-1.5 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-900/30"
              >
                Retake
              </button>
            </div>
          )
        )}

        <FootprintSummary
          totalKgCo2e={total}
          periodDays={PERIOD_DAYS}
          totalCostUsd={totalCostUsd}
        />

        {/* Two ways to log, side by side on wider screens. */}
        <div className={gridRow}>
          <section aria-labelledby="logger-heading" className={cardClass}>
            <h2 id="logger-heading" className="sr-only">
              Log a new activity
            </h2>
            <ActivityLogger onLog={handleLog} />
          </section>

          <ReceiptUpload onLogMany={handleLogMany} />
        </div>

        {/* Motivation + data, side by side. */}
        <div className={gridRow}>
          <GoalTracker
            dailyBudgetKg={dailyBudgetKg}
            onChangeBudget={setDailyBudgetKg}
            todayKg={todayKg}
            streak={streak}
            achievements={achievements}
          />

          <CategoryBreakdown totals={categoryTotals} />
        </div>

        <TrendChart data={trend} weeklyTargetKg={WEEKLY_TARGET_KG} />

        <CoachPanel
          totalKgCo2e={total}
          periodDays={PERIOD_DAYS}
          topCategories={categoryTotals.slice(0, 5)}
        />

        {/* Trust + share, side by side. */}
        <div className={gridRow}>
          <Methodology />

          <ImpactCardShare
            data={{
              totalKgCo2e: total,
              periodDays: PERIOD_DAYS,
              streak,
              topCategoryLabel,
            }}
          />
        </div>

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
          onUndo={toast.undoIds.length > 0 ? handleUndo : undefined}
          onDismiss={() => setToast(null)}
        />
      )}
    </>
  );
}

function truncate(text: string, max = 40): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

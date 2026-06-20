"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Compass } from "lucide-react";
import type { LoggedActivity } from "@/types/activity";
import { allAchievements } from "@/lib/gamification/streaks";
import { appendEntry, loadLog, saveLog } from "@/lib/storage/footprintLog";
import { serializeLog } from "@/lib/storage/exportLog";
import {
  loadBaseline,
  saveBaseline,
  skipBaseline,
  type StoredBaseline,
} from "@/lib/storage/baseline";
import { loadDailyBudget, saveDailyBudget } from "@/lib/storage/goal";
import {
  annualBreakdownFromBaseline,
  annualBreakdownFromEntries,
  hasModelledFootprint,
} from "@/lib/simulator/reductionSimulator";
import {
  useDashboardMetrics,
  PERIOD_DAYS,
} from "@/hooks/useDashboardMetrics";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { ActivityLogger } from "./ActivityLogger";
import { AppHeader } from "./AppHeader";
import { BaselineEstimator } from "./BaselineEstimator";
import { CategoryBreakdown } from "./CategoryBreakdown";
import { CoachHub } from "./CoachHub";
import { FloatingActionButton } from "./FloatingActionButton";
import { FootprintSummary } from "./FootprintSummary";
import { GoalTracker } from "./GoalTracker";
import { ImpactCardShare } from "./ImpactCardShare";
import { Methodology } from "./Methodology";
import { ReceiptUpload } from "./ReceiptUpload";
import { ReductionSimulator } from "./ReductionSimulator";
import { SiteFooter } from "./SiteFooter";
import { Toast } from "./Toast";
import { Confetti } from "./dashboard/Confetti";
import { QuickLogSheet, ShortcutsModal } from "./dashboard/dialogs";
import { RecentActivity } from "./dashboard/RecentActivity";

interface ToastState {
  message: string;
  undo?: () => void;
}

const cardClass = "glass-card rounded-[24px] p-6 shadow-lg";

const gridRow = "grid gap-5 md:grid-cols-2";

/**
 * Entry counts that earn a celebration. Confetti on every log is noise; only
 * on the first is anticlimactic — milestones keep the habit loop rewarding.
 */
const MILESTONES: Record<number, string> = {
  1: "First activity logged! 🌱",
  10: "10 activities logged! 🎯",
  25: "25 activities — building a real picture! 📊",
  50: "50 activities logged! 🚀",
  100: "Century! 100 activities logged! 🎉",
};

/**
 * The main application screen: headline metrics, the activity logger, receipt
 * upload, coaching, and the recent-activity log. Owns the entry list and the
 * derived metrics; presentation-heavy concerns (modals, confetti, the recent
 * list's own filter/sort UI) live in `./dashboard/*`.
 */
export function Dashboard() {
  const [entries, setEntries] = useState<LoggedActivity[]>(() => loadLog());
  const [dailyBudgetKg, setDailyBudgetKg] = useState<number>(() =>
    loadDailyBudget(),
  );
  const [baseline, setBaseline] = useState<StoredBaseline | null>(() =>
    loadBaseline(),
  );
  const [retaking, setRetaking] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [prefill, setPrefill] = useState<string | undefined>(undefined);
  const [confettiKey, setConfettiKey] = useState(0);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [showLogSheet, setShowLogSheet] = useState(false);
  const loggerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    saveLog(entries);
  }, [entries]);

  useEffect(() => {
    saveDailyBudget(dailyBudgetKg);
  }, [dailyBudgetKg]);

  const scrollToLogger = useCallback(() => {
    loggerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => {
      loggerRef.current?.querySelector("input")?.focus();
    }, 400);
  }, []);

  function handleLog(entry: LoggedActivity) {
    const snapshot = entries;
    const milestone = MILESTONES[entries.length + 1];
    setEntries((current) => appendEntry(current, entry));
    if (milestone) setConfettiKey((k) => k + 1);
    setToast({
      message: milestone ?? `Logged "${truncate(entry.description)}"`,
      undo: () => setEntries(snapshot),
    });
  }

  function handleLogMany(newEntries: LoggedActivity[]) {
    const snapshot = entries;
    setEntries((current) =>
      newEntries.reduce((acc, entry) => appendEntry(acc, entry), current),
    );
    setToast({
      message: `Added ${newEntries.length} ${
        newEntries.length === 1 ? "activity" : "activities"
      } from your receipt`,
      undo: () => setEntries(snapshot),
    });
  }

  function handleDelete(id: string) {
    const snapshot = entries;
    const removed = entries.find((entry) => entry.id === id);
    setEntries((current) => current.filter((entry) => entry.id !== id));
    setToast({
      message: removed
        ? `Removed "${truncate(removed.description)}"`
        : "Removed entry",
      undo: () => setEntries(snapshot),
    });
  }

  function handleClearAll() {
    const snapshot = entries;
    setEntries([]);
    setToast({
      message: "Cleared all activity",
      undo: () => setEntries(snapshot),
    });
  }

  function handleExport() {
    const json = serializeLog(entries);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `carbon-coach-data-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 15_000);
  }

  const toastRef = useRef(toast);

  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  useKeyboardShortcuts([
    { key: "n", ctrl: true, handler: scrollToLogger },
    {
      key: "z",
      ctrl: true,
      handler: () => {
        toastRef.current?.undo?.();
        setToast(null);
      },
    },
    { key: "e", ctrl: true, handler: handleExport },
    { key: "?", handler: () => setShowShortcutsHelp((v) => !v) },
  ]);

  function handleUndo() {
    toast?.undo?.();
    setToast(null);
  }

  function handleBaselineComplete(result: StoredBaseline) {
    saveBaseline(result);
    setBaseline(result);
    setRetaking(false);
    setToast({
      message: `Baseline set: ≈ ${result.annualTonnes.toFixed(1)} t/yr`,
    });
  }

  function handleBaselineSkip() {
    skipBaseline();
    setBaseline(loadBaseline());
    setRetaking(false);
  }

  const {
    recentEntries,
    total,
    totalCostUsd,
    categoryTotals,
    todayKg,
    streak,
    achievements,
    topCategoryLabel,
  } = useDashboardMetrics(entries, dailyBudgetKg);

  const hasEntries = entries.length > 0;

  // Value before friction: new visitors land on the logger and get their first
  // number immediately. The baseline quiz appears only after that first log
  // (or when explicitly retaking) — an upsell, not a gate.
  const showEstimator = retaking || (baseline === null && hasEntries);
  const hasSavedEstimate = baseline !== null && baseline.annualTonnes > 0;

  const simulatorBreakdown = hasEntries
    ? annualBreakdownFromEntries(categoryTotals, PERIOD_DAYS)
    : baseline && baseline.annualTonnes > 0
      ? annualBreakdownFromBaseline(baseline.answers)
      : null;

  return (
    <>
      <AppHeader
        achievementsUnlocked={achievements.length}
        achievementsTotal={allAchievements().length}
      />

      <div className="flex w-full max-w-7xl flex-col gap-5 rounded-[32px] border border-[var(--glass-border)] bg-[var(--glass-bg)] px-6 py-8 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] sm:px-10 sm:py-10">
        <div className="animate-fade-up">
          <h1 className="text-3xl font-extrabold tracking-tight text-stone-900 dark:text-emerald-50 sm:text-4xl">
            Your{" "}
            <span className="bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent dark:from-emerald-300 dark:to-emerald-500">
              carbon
            </span>{" "}
            dashboard
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-stone-600 dark:text-stone-400">
            Log everyday activities in plain language, or scan a receipt — see a
            clear, personalised picture of your impact in seconds.
          </p>
          <p className="mt-2 max-w-2xl text-sm text-stone-500 dark:text-stone-500">
            India&apos;s urban households emit{" "}
            <span className="font-semibold text-amber-700 dark:text-amber-400">
              4–5 t CO₂e / year
            </span>
            . The Paris-aligned target is{" "}
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">
              2 t / year
            </span>
            . This dashboard helps you close that gap.
          </p>
        </div>

        {/* ROW 1: Hero metrics — Summary + Goal side-by-side above the fold */}
        <div className="grid gap-5 md:grid-cols-2">
          <FootprintSummary
            totalKgCo2e={total}
            periodDays={PERIOD_DAYS}
            totalCostUsd={totalCostUsd}
          />
          <GoalTracker
            dailyBudgetKg={dailyBudgetKg}
            onChangeBudget={setDailyBudgetKg}
            todayKg={todayKg}
            streak={streak}
            achievements={achievements}
          />
        </div>

        {/* ROW 2: Primary action — Logger full-width */}
        <section
          ref={loggerRef}
          aria-labelledby="logger-heading"
          className={cardClass}
        >
          <h2 id="logger-heading" className="sr-only">
            Log a new activity
          </h2>
          <ActivityLogger onLog={handleLog} prefill={prefill} />
        </section>

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

        <div className={gridRow}>
          <ReceiptUpload onLogMany={handleLogMany} />

          <CategoryBreakdown totals={categoryTotals} />
        </div>

        {simulatorBreakdown && hasModelledFootprint(simulatorBreakdown) && (
          <ReductionSimulator
            breakdown={simulatorBreakdown}
            source={hasEntries ? "logged" : "estimate"}
          />
        )}

        <CoachHub
          totalKgCo2e={total}
          periodDays={PERIOD_DAYS}
          topCategories={categoryTotals.slice(0, 5)}
          hasEntries={hasEntries}
          dailyBudgetKg={dailyBudgetKg}
          onApplySwap={(prefill) => {
            setPrefill(prefill);
            scrollToLogger();
          }}
        />

        {hasEntries ? (
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
        ) : (
          <Methodology />
        )}

        <RecentActivity
          recentEntries={recentEntries}
          onDelete={handleDelete}
          onSelectExample={(text) => {
            setPrefill(text);
            scrollToLogger();
          }}
          onExport={handleExport}
          onClearAll={handleClearAll}
        />
      </div>

      <SiteFooter />

      {toast && (
        <Toast
          message={toast.message}
          onUndo={toast.undo ? handleUndo : undefined}
          onDismiss={() => setToast(null)}
          duration={toast.undo ? 10000 : 6000}
        />
      )}

      <FloatingActionButton onClick={() => setShowLogSheet(true)} />

      {showLogSheet && (
        <QuickLogSheet onClose={() => setShowLogSheet(false)}>
          <ActivityLogger
            onLog={(entry) => {
              handleLog(entry);
              setShowLogSheet(false);
            }}
          />
        </QuickLogSheet>
      )}

      {confettiKey > 0 && <Confetti key={confettiKey} />}

      {showShortcutsHelp && (
        <ShortcutsModal onClose={() => setShowShortcutsHelp(false)} />
      )}
    </>
  );
}

function truncate(text: string, max = 40): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

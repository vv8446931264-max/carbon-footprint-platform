"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Compass,
  Download,
  Keyboard,
  LineChart,
  Search,
  Trash2,
  X,
} from "lucide-react";
import type { ActivityCategory, LoggedActivity } from "@/types/activity";
import {
  entriesWithinDays,
  totalEmissions,
  totalsByCategory,
} from "@/lib/emissions/aggregate";
import { PARIS_ALIGNED_DAILY_KG } from "@/lib/emissions/calculate";
import { suggestSwap } from "@/lib/emissions/compare";
import { estimateCostUsd } from "@/lib/emissions/cost";
import { weeklyTrend } from "@/lib/emissions/trend";
import { localDayKey } from "@/lib/dates/localDay";
import {
  allAchievements,
  currentStreak,
  dailyTotals,
  unlockedAchievements,
} from "@/lib/gamification/streaks";
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
import { CATEGORY_LABELS, CATEGORY_VISUALS } from "@/lib/ui/categories";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { ActivityLogger } from "./ActivityLogger";
import { ActivityList } from "./ActivityList";
import { AppHeader } from "./AppHeader";
import { BaselineEstimator } from "./BaselineEstimator";
import { CategoryBreakdown } from "./CategoryBreakdown";
import { CoachPanel } from "./CoachPanel";
import { FloatingActionButton } from "./FloatingActionButton";
import { FootprintSummary } from "./FootprintSummary";
import { GoalTracker } from "./GoalTracker";
import { ImpactCardShare } from "./ImpactCardShare";
import { Methodology } from "./Methodology";
import { ReceiptUpload } from "./ReceiptUpload";
import { ReductionSimulator } from "./ReductionSimulator";
import { SiteFooter } from "./SiteFooter";
import { SmartSwaps } from "./SmartSwaps";
import { TrendChart } from "./TrendChart";
import { Toast } from "./Toast";

const PERIOD_DAYS = 30;
const TREND_WEEKS = 8;
const WEEKLY_TARGET_KG = PARIS_ALIGNED_DAILY_KG * 7;
// Trend and coach panels need enough data points to be meaningful
const MIN_ENTRIES_FOR_INSIGHTS = 3;
// How many activities to show before "Show more"
const DEFAULT_VISIBLE = 5;

interface ToastState {
  message: string;
  undo?: () => void;
}

const cardClass =
  "rounded-[20px] border border-stone-100/80 bg-white/90 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] backdrop-blur-sm dark:border-stone-800/60 dark:bg-stone-900/80";

const gridRow = "grid gap-6 md:grid-cols-2";

const ALL_CATEGORIES = Object.keys(CATEGORY_VISUALS) as ActivityCategory[];

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

type SortOrder = "newest" | "emissions" | "cost";

export function Dashboard() {
  const [entries, setEntries] = useState<LoggedActivity[]>(() => loadLog());
  const [dailyBudgetKg, setDailyBudgetKg] = useState<number>(() =>
    loadDailyBudget(),
  );
  const [baseline, setBaseline] = useState<StoredBaseline | null>(() =>
    loadBaseline(),
  );
  const [retaking, setRetaking] = useState(false);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [prefill, setPrefill] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | ActivityCategory>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [visibleCount, setVisibleCount] = useState(DEFAULT_VISIBLE);
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

  // Reset visible count whenever search, filter, or sort changes
  useEffect(() => {
    setVisibleCount(DEFAULT_VISIBLE);
  }, [searchQuery, categoryFilter, sortOrder]);

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
    setConfirmingClear(false);
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
  toastRef.current = toast;

  useKeyboardShortcuts([
    { key: "n", ctrl: true, handler: scrollToLogger },
    {
      key: "z",
      ctrl: true,
      handler: () => { toastRef.current?.undo?.(); setToast(null); },
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
    trend,
    todayKg,
    streak,
    achievements,
    topCategoryLabel,
  } = useMemo(() => {
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
    const weeklyData = weeklyTrend(entries, TREND_WEEKS);

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
      trend: weeklyData,
      todayKg: dayTotal,
      streak: currentStreakVal,
      achievements: unlocked,
      topCategoryLabel: topLabel,
    };
  }, [entries, dailyBudgetKg]);

  const filteredEntries = useMemo(() => {
    let result = recentEntries;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((e) => e.description.toLowerCase().includes(q));
    }
    if (categoryFilter !== "all") {
      result = result.filter((e) => e.activity.category === categoryFilter);
    }
    if (sortOrder === "emissions") {
      result = [...result].sort((a, b) => b.emissionsKgCo2e - a.emissionsKgCo2e);
    } else if (sortOrder === "cost") {
      result = [...result].sort(
        (a, b) => estimateCostUsd(b.activity) - estimateCostUsd(a.activity),
      );
    }
    return result;
  }, [recentEntries, searchQuery, categoryFilter, sortOrder]);

  const hasEntries = entries.length > 0;
  const hasEnoughForInsights = entries.length >= MIN_ENTRIES_FOR_INSIGHTS;

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

  const visibleEntries = filteredEntries.slice(0, visibleCount);
  const remainingCount = filteredEntries.length - visibleCount;
  const isFiltered = !!(searchQuery.trim() || categoryFilter !== "all");

  return (
    <>
      <AppHeader
        achievementsUnlocked={achievements.length}
        achievementsTotal={allAchievements().length}
      />

      <div className="flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-8">
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

        <FootprintSummary
          totalKgCo2e={total}
          periodDays={PERIOD_DAYS}
          totalCostUsd={totalCostUsd}
        />

        {/* Primary action (log) and primary motivation (today's budget +
            streak) share the top row — both above the fold. */}
        <div className={gridRow}>
          <section ref={loggerRef} aria-labelledby="logger-heading" className={cardClass}>
            <h2 id="logger-heading" className="sr-only">
              Log a new activity
            </h2>
            <ActivityLogger
              onLog={handleLog}
              prefill={prefill}
            />
          </section>

          <GoalTracker
            dailyBudgetKg={dailyBudgetKg}
            onChangeBudget={setDailyBudgetKg}
            todayKg={todayKg}
            streak={streak}
            achievements={achievements}
          />
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

        {/* Trend and coach panels are only meaningful with enough data points.
            Until then, show a teaser so people know insights exist and how to
            unlock them — silently hiding them reads as "the app is broken". */}
        <SmartSwaps
          onApplySwap={(prefill) => {
            setPrefill(prefill);
            scrollToLogger();
          }}
        />

        {hasEnoughForInsights ? (
          <>
            <TrendChart data={trend} weeklyTargetKg={WEEKLY_TARGET_KG} />

            <CoachPanel
              totalKgCo2e={total}
              periodDays={PERIOD_DAYS}
              topCategories={categoryTotals.slice(0, 5)}
            />
          </>
        ) : (
          hasEntries && (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50/60 p-8 text-center dark:border-stone-700 dark:bg-stone-900/40">
              <LineChart
                className="mx-auto h-10 w-10 text-stone-300 dark:text-stone-600"
                aria-hidden="true"
              />
              <h3 className="mt-3 text-base font-semibold text-stone-900 dark:text-stone-50">
                Unlock your trend chart &amp; AI coach
              </h3>
              <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                Log {MIN_ENTRIES_FOR_INSIGHTS - entries.length} more{" "}
                {MIN_ENTRIES_FOR_INSIGHTS - entries.length === 1
                  ? "activity"
                  : "activities"}{" "}
                to see your weekly emissions trend and personalized coaching.
              </p>
              <div
                className="mt-4 flex justify-center gap-2"
                role="img"
                aria-label={`${entries.length} of ${MIN_ENTRIES_FOR_INSIGHTS} activities logged`}
              >
                {Array.from({ length: MIN_ENTRIES_FOR_INSIGHTS }, (_, i) => (
                  <div
                    key={i}
                    className={`h-2 w-12 rounded-full ${
                      i < entries.length
                        ? "bg-emerald-500"
                        : "bg-stone-200 dark:bg-stone-700"
                    }`}
                  />
                ))}
              </div>
            </div>
          )
        )}

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

        <section
          aria-labelledby="recent-heading"
          className="flex flex-col gap-3"
        >
          <div className="flex items-center justify-between gap-3">
            <h2
              id="recent-heading"
              className="text-base font-semibold text-stone-900 dark:text-stone-50"
            >
              Recent activity
            </h2>
            {entries.length > 0 &&
              (confirmingClear ? (
                <span className="flex items-center gap-2 text-xs">
                  <span className="text-stone-500 dark:text-stone-400">
                    Clear everything?
                  </span>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="rounded-md bg-rose-600 px-2 py-1 font-semibold text-white transition hover:bg-rose-700 focus-visible:ring-2 focus-visible:ring-rose-500"
                  >
                    Clear all
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingClear(false)}
                    className="rounded-md px-2 py-1 font-medium text-stone-600 transition hover:text-stone-900 dark:text-stone-300 dark:hover:text-stone-100"
                  >
                    Cancel
                  </button>
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleExport}
                    className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-stone-500 transition hover:text-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-stone-400 dark:hover:text-emerald-400"
                    title="Download your activity log as a JSON file"
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden="true" />
                    Export
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingClear(true)}
                    className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-stone-500 transition hover:text-rose-600 focus-visible:ring-2 focus-visible:ring-rose-500 dark:text-stone-400 dark:hover:text-rose-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Clear all
                  </button>
                </span>
              ))}
          </div>

          {recentEntries.length > 0 && (
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400 dark:text-stone-500" aria-hidden="true" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search activities…"
                  className="w-full rounded-lg border border-stone-300 bg-white py-2 pl-9 pr-9 text-sm outline-none transition focus-visible:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500/40 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search"
                    className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-stone-400 transition hover:bg-stone-100 hover:text-stone-600 dark:hover:bg-stone-800 dark:hover:text-stone-300"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              </div>
              <select
                value={categoryFilter}
                onChange={(e) =>
                  setCategoryFilter(e.target.value as "all" | ActivityCategory)
                }
                aria-label="Filter by category"
                className="rounded-lg border border-stone-300 bg-white px-2.5 py-2 text-sm text-stone-700 outline-none transition focus-visible:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500/40 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200"
              >
                <option value="all">All</option>
                {ALL_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_LABELS[cat]}
                  </option>
                ))}
              </select>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                aria-label="Sort activities"
                className="rounded-lg border border-stone-300 bg-white px-2.5 py-2 text-sm text-stone-700 outline-none transition focus-visible:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500/40 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200"
              >
                <option value="newest">Newest</option>
                <option value="emissions">Highest CO₂e</option>
                <option value="cost">Highest cost</option>
              </select>
            </div>
          )}

          {/* Tell people (and screen readers) what the filters returned. */}
          {recentEntries.length > 0 && isFiltered && (
            <p
              role="status"
              aria-live="polite"
              className="text-xs text-stone-500 dark:text-stone-400"
            >
              Showing {filteredEntries.length} of {recentEntries.length}{" "}
              activities
            </p>
          )}

          <ActivityList
            entries={visibleEntries}
            onDelete={handleDelete}
            onSelectExample={(text) => {
              setPrefill(text);
              scrollToLogger();
            }}
            isFiltered={isFiltered}
          />

          {remainingCount > 0 && (
            <button
              type="button"
              onClick={() => setVisibleCount((n) => n + DEFAULT_VISIBLE)}
              className="mt-1 w-full rounded-xl border border-stone-200 bg-white py-2.5 text-sm font-medium text-stone-600 transition hover:border-emerald-300 hover:text-emerald-700 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-emerald-700 dark:hover:text-emerald-400"
            >
              Show {Math.min(remainingCount, DEFAULT_VISIBLE)} more
              <span className="ml-1 text-stone-400 dark:text-stone-500">
                ({remainingCount} remaining)
              </span>
            </button>
          )}
        </section>
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

      {confettiKey > 0 && (
        <Confetti key={confettiKey} />
      )}

      {showShortcutsHelp && (
        <ShortcutsModal onClose={() => setShowShortcutsHelp(false)} />
      )}
    </>
  );
}

// ─── Confetti ─────────────────────────────────────────────────────────────────

const CONFETTI_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#f43f5e", "#8b5cf6"];

function Confetti() {
  const particles = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        id: i,
        left: `${6 + Math.random() * 88}%`,
        delay: `${(Math.random() * 0.4).toFixed(2)}s`,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      })),
    [],
  );

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      {particles.map((p) => (
        <div
          key={p.id}
          className="animate-confetti-fall absolute -top-3 h-2.5 w-2.5 rounded-sm"
          style={{ left: p.left, animationDelay: p.delay, backgroundColor: p.color }}
        />
      ))}
    </div>
  );
}

// ─── Modal behaviour ──────────────────────────────────────────────────────────

/**
 * Shared dialog plumbing: close on Escape, focus the dialog on open, and
 * return focus to whatever opened it when it unmounts.
 */
function useDialog(onClose: () => void) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      opener?.focus();
    };
  }, [onClose]);

  return dialogRef;
}

// ─── Quick-log bottom sheet (opened by the mobile FAB) ───────────────────────

function QuickLogSheet({
  onClose,
  children,
}: {
  onClose: () => void;
  children: React.ReactNode;
}) {
  const dialogRef = useDialog(onClose);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-log-heading"
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="relative w-full max-w-lg rounded-t-2xl border border-stone-200 bg-white p-6 pb-8 shadow-xl outline-none dark:border-stone-700 dark:bg-stone-900 sm:rounded-2xl sm:pb-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2
            id="quick-log-heading"
            className="text-sm font-semibold text-stone-900 dark:text-stone-50"
          >
            Log an activity
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Keyboard shortcuts modal ─────────────────────────────────────────────────

const SHORTCUTS = [
  { keys: ["Ctrl", "N"], label: "Focus the activity input" },
  { keys: ["Ctrl", "Z"], label: "Undo the last action" },
  { keys: ["Ctrl", "E"], label: "Export your data as JSON" },
  { keys: ["?"], label: "Toggle this help panel" },
];

function ShortcutsModal({ onClose }: { onClose: () => void }) {
  const dialogRef = useDialog(onClose);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-heading"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="relative w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-6 shadow-xl outline-none dark:border-stone-700 dark:bg-stone-900"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2
            id="shortcuts-heading"
            className="flex items-center gap-2 text-sm font-semibold text-stone-900 dark:text-stone-50"
          >
            <Keyboard className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            Keyboard shortcuts
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close shortcuts panel"
            className="rounded-md p-1 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <ul className="flex flex-col gap-3">
          {SHORTCUTS.map((shortcut) => (
            <li key={shortcut.label} className="flex items-center justify-between gap-4">
              <span className="text-sm text-stone-600 dark:text-stone-300">{shortcut.label}</span>
              <span className="flex shrink-0 items-center gap-1">
                {shortcut.keys.map((k) => (
                  <kbd
                    key={k}
                    className="rounded border border-stone-300 bg-stone-100 px-1.5 py-0.5 font-mono text-xs text-stone-700 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-200"
                  >
                    {k}
                  </kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-stone-400 dark:text-stone-500">
          Shortcuts are inactive when an input is focused.
        </p>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function truncate(text: string, max = 40): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

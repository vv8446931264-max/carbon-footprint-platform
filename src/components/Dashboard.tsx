"use client";

import { useEffect, useState } from "react";
import type { LoggedActivity } from "@/types/activity";
import { entriesWithinDays, totalEmissions, totalsByCategory } from "@/lib/emissions/aggregate";
import { appendEntry, loadLog, saveLog } from "@/lib/storage/footprintLog";
import { ActivityLogger } from "./ActivityLogger";
import { ActivityList } from "./ActivityList";
import { CategoryBreakdown } from "./CategoryBreakdown";
import { CoachPanel } from "./CoachPanel";
import { FootprintSummary } from "./FootprintSummary";

const PERIOD_DAYS = 30;

/**
 * Top-level client component that owns the activity log state and derives
 * every view (summary, chart, coach input) from it. Persists to localStorage
 * so a person's data survives reloads without needing a backend for the demo.
 */
export function Dashboard() {
  // Lazy initializer runs once on the client during the first render, so the
  // log is available immediately without an extra effect-driven re-render.
  // loadLog/saveLog are no-ops on the server (guarded inside the storage module).
  const [entries, setEntries] = useState<LoggedActivity[]>(() => loadLog());

  useEffect(() => {
    saveLog(entries);
  }, [entries]);

  function handleLog(entry: LoggedActivity) {
    setEntries((current) => appendEntry(current, entry));
  }

  const recentEntries = entriesWithinDays(entries, PERIOD_DAYS);
  const total = totalEmissions(recentEntries);
  const categoryTotals = totalsByCategory(recentEntries);

  return (
    <div className="flex w-full max-w-4xl flex-col gap-6 px-4 py-10 sm:px-8">
      <header>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Carbon Footprint Coach</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Log everyday activities in plain language and get a personalized picture of your impact.
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

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <FootprintSummary totalKgCo2e={total} periodDays={PERIOD_DAYS} />
        <CoachPanel totalKgCo2e={total} periodDays={PERIOD_DAYS} topCategories={categoryTotals.slice(0, 5)} />
      </div>

      <CategoryBreakdown totals={categoryTotals} />

      <section aria-labelledby="recent-heading" className="flex flex-col gap-3">
        <h2 id="recent-heading" className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Recent activity
        </h2>
        <ActivityList entries={recentEntries.slice(0, 20)} />
      </section>
    </div>
  );
}

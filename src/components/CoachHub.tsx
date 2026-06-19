"use client";

import { Loader2 } from "lucide-react";
import type { CategoryTotal } from "@/lib/emissions/aggregate";
import { useCoachReport } from "./coach/useCoachReport";
import { CoachReportCard } from "./coach/CoachReportCard";
import { SmartSwapCarousel } from "./coach/SmartSwapCarousel";
import { ProjectedImpactChart } from "./coach/ProjectedImpactChart";

interface CoachHubProps {
  totalKgCo2e: number;
  periodDays: number;
  topCategories: CategoryTotal[];
  hasEntries: boolean;
  dailyBudgetKg?: number;
  /** Prefill the activity logger when a smart swap is applied. */
  onApplySwap: (prefill: string) => void;
}

/**
 * The AI coach hub: a Vertex AI report card, smart-swap carousel, and a
 * projected-impact chart. Owns only the report request (via `useCoachReport`);
 * the swap carousel and chart manage their own state.
 */
export function CoachHub({
  totalKgCo2e,
  periodDays,
  dailyBudgetKg,
  topCategories,
  hasEntries,
  onApplySwap,
}: CoachHubProps) {
  const { report, status, errorMessage, generate } = useCoachReport({
    totalKgCo2e,
    periodDays,
    topCategories,
    dailyBudgetKg,
  });

  return (
    <section
      aria-labelledby="coach-heading"
      className="glass-card rounded-[24px] p-6 sm:p-8"
    >
      {/* ── Header ── */}
      <div className="mb-6 space-y-4">
        {/* Progress bar */}
        <div className="flex items-center gap-4">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-stone-200/40 shadow-inner dark:bg-stone-800/40">
            <div
              className={`h-full rounded-full bg-gradient-to-r from-emerald-600 via-emerald-400 to-teal-400 shadow-[0_0_8px_rgba(16,185,129,0.4)] transition-all duration-700 ${
                status === "loading" ? "animate-ai-progress" : "w-[85%]"
              }`}
            />
          </div>
          <span className="shrink-0 text-xs font-semibold tabular-nums text-stone-500 dark:text-stone-400">
            {status === "loading" ? "Analysing..." : "85%"}
          </span>
        </div>

        {/* Title + button */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2
              id="coach-heading"
              className="text-2xl font-extrabold tracking-tight text-stone-900 dark:text-emerald-50 sm:text-3xl"
            >
              Interactive AI Coach Hub
            </h2>
            <p className="mt-0.5 text-sm text-stone-500 dark:text-stone-400">
              Powered by Vertex AI
            </p>
          </div>
          <button
            type="button"
            onClick={generate}
            disabled={status === "loading" || !hasEntries}
            className="inline-flex items-center gap-2 rounded-[14px] bg-gradient-to-b from-emerald-500 to-emerald-700 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition-all duration-200 hover:shadow-xl hover:shadow-emerald-600/35 hover:brightness-110 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status === "loading" && (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            )}
            {status === "loading"
              ? "Thinking..."
              : report
                ? "Regenerate"
                : "Get report"}
          </button>
        </div>
      </div>

      {/* ── Body: 5-column grid ── */}
      <div className="grid gap-5 lg:grid-cols-5">
        {/* Left (3/5): AI Analysis card + Smart Swaps */}
        <div className="flex flex-col gap-4 lg:col-span-3">
          <CoachReportCard
            status={status}
            report={report}
            errorMessage={errorMessage}
            hasEntries={hasEntries}
          />
          <SmartSwapCarousel onApplySwap={onApplySwap} />
        </div>

        {/* Right (2/5): Projected Impact chart */}
        <ProjectedImpactChart
          hasEntries={hasEntries}
          totalKgCo2e={totalKgCo2e}
          periodDays={periodDays}
        />
      </div>
    </section>
  );
}

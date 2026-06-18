"use client";

import { useState } from "react";
import { Loader2, MessageCircleHeart, Sprout } from "lucide-react";
import type { CategoryTotal } from "@/lib/emissions/aggregate";
import type { CoachReport } from "@/types/ai";

interface CoachPanelProps {
  totalKgCo2e: number;
  periodDays: number;
  topCategories: CategoryTotal[];
}

/**
 * On-demand AI coaching report. Generation is user-triggered (not automatic)
 * so we don't burn AI credits on every render, and so the user stays in control
 * of when a network/AI call happens — relevant for both cost and trust.
 */
export function CoachPanel({
  totalKgCo2e,
  periodDays,
  topCategories,
}: CoachPanelProps) {
  const [report, setReport] = useState<CoachReport | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleGenerate() {
    if (status === "loading") return;
    setStatus("loading");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalKgCo2e,
          periodDays,
          topCategories: topCategories.map(({ category, kgCo2e }) => ({
            category,
            kgCo2e,
          })),
        }),
      });

      const data = (await response.json()) as CoachReport | { error: string };
      if (!response.ok || "error" in data) {
        throw new Error(
          "error" in data ? data.error : "Could not generate a report.",
        );
      }

      setReport(data);
      setStatus("idle");
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    }
  }

  return (
    <section
      aria-labelledby="coach-heading"
      className="glass-card rounded-[20px] p-6 sm:p-8"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id="coach-heading"
          className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400"
        >
          <MessageCircleHeart
            className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
            aria-hidden="true"
          />
          Personal carbon coach
        </h2>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={status === "loading" || totalKgCo2e === 0}
          className="inline-flex items-center gap-1.5 rounded-[12px] bg-gradient-to-b from-emerald-500 to-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-emerald-600/20 transition-all hover:shadow-lg hover:shadow-emerald-600/30 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "loading" && (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          )}
          {status === "loading"
            ? "Thinking…"
            : report
              ? "Regenerate report"
              : "Get my report"}
        </button>
      </div>

      <div role="status" aria-live="polite" className="mt-6">
        {status === "loading" && (
          <>
            <div className="mb-3">
              <p className="mb-1.5 text-xs font-medium text-stone-500 dark:text-stone-400">
                AI analysis in progress…
              </p>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-200/60 dark:bg-stone-800/60">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 animate-ai-progress" />
              </div>
            </div>
            <div className="flex flex-col gap-3 rounded-xl bg-stone-50/60 p-4 dark:bg-stone-800/30" aria-hidden="true">
              <div className="h-3.5 w-full animate-pulse rounded-full bg-stone-200 dark:bg-stone-700" />
              <div className="h-3.5 w-5/6 animate-pulse rounded-full bg-stone-200 dark:bg-stone-700" />
              <div className="h-3.5 w-2/3 animate-pulse rounded-full bg-stone-200/70 dark:bg-stone-700/70" />
            </div>
          </>
        )}

        {status === "error" && (
          <div className="rounded-xl bg-red-50/80 px-4 py-3 dark:bg-red-950/30">
            <p className="text-sm text-red-600 dark:text-red-400">
              {errorMessage}
            </p>
          </div>
        )}

        {status !== "loading" && !report && status !== "error" && (
          <div className="rounded-xl bg-stone-50/60 px-4 py-3 dark:bg-stone-800/30">
            <p className="text-sm text-stone-600 dark:text-stone-400">
              {totalKgCo2e === 0
                ? "🌱 Log a few activities to unlock your personalised report."
                : "✨ Get a short, encouraging report with tips tailored to your top categories."}
            </p>
          </div>
        )}

        {status === "idle" && report && (
          <div className="flex flex-col gap-4 rounded-[16px] bg-emerald-800 p-5 dark:bg-emerald-900/90">
            <div className="flex items-center gap-2">
              <Sprout className="h-4 w-4 text-emerald-300" aria-hidden="true" />
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                Vertex AI Analysis
              </span>
            </div>
            <h3 className="text-base font-bold text-white">
              Weekly Report
            </h3>
            <p className="text-sm leading-relaxed text-emerald-100">
              {report.summary}
            </p>
            <p className="text-sm font-semibold text-emerald-300">
              {report.encouragement}
            </p>
            <ul className="flex flex-col gap-2 text-sm text-emerald-100">
              {report.tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2.5 rounded-lg bg-white/10 px-3 py-2">
                  <Sprout
                    className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300"
                    aria-hidden="true"
                  />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

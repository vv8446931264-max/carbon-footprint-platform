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
      className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id="coach-heading"
          className="flex items-center gap-2 text-base font-semibold text-stone-900 dark:text-stone-50"
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
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
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

      <div role="status" aria-live="polite" className="mt-4">
        {status === "loading" && (
          <div className="flex flex-col gap-2.5" aria-hidden="true">
            <div className="animate-skeleton h-3.5 w-full rounded bg-stone-200 dark:bg-stone-800" />
            <div className="animate-skeleton h-3.5 w-5/6 rounded bg-stone-200 dark:bg-stone-800" />
            <div className="animate-skeleton mt-2 h-3.5 w-2/3 rounded bg-stone-200 dark:bg-stone-800" />
          </div>
        )}

        {status === "error" && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {errorMessage}
          </p>
        )}

        {status !== "loading" && !report && status !== "error" && (
          <p className="text-sm text-stone-500 dark:text-stone-400">
            {totalKgCo2e === 0
              ? "Log a few activities to unlock your report."
              : "Get a short, encouraging report with tips tailored to your top categories."}
          </p>
        )}

        {status === "idle" && report && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-stone-800 dark:text-stone-100">
              {report.summary}
            </p>
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              {report.encouragement}
            </p>
            <ul className="flex flex-col gap-1.5 text-sm text-stone-700 dark:text-stone-300">
              {report.tips.map((tip, index) => (
                <li key={index} className="flex gap-2">
                  <Sprout
                    className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
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

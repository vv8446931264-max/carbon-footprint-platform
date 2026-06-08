"use client";

import { useState } from "react";
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
      className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id="coach-heading"
          className="text-sm font-medium text-zinc-500 dark:text-zinc-400"
        >
          Personal carbon coach
        </h2>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={status === "loading" || totalKgCo2e === 0}
          className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-zinc-700 focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-700"
        >
          {status === "loading"
            ? "Thinking…"
            : report
              ? "Regenerate report"
              : "Get my report"}
        </button>
      </div>

      <div role="status" aria-live="polite" className="mt-4">
        {status === "error" && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {errorMessage}
          </p>
        )}

        {!report && status !== "error" && totalKgCo2e === 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Log a few activities to unlock your report.
          </p>
        )}

        {report && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-zinc-800 dark:text-zinc-100">
              {report.summary}
            </p>
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              {report.encouragement}
            </p>
            <ul className="flex flex-col gap-1.5 text-sm text-zinc-700 dark:text-zinc-300">
              {report.tips.map((tip, index) => (
                <li key={index} className="flex gap-2">
                  <span aria-hidden="true">🌱</span>
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

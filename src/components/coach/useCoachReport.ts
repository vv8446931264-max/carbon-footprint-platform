"use client";

import { useState } from "react";
import type { CategoryTotal } from "@/lib/emissions/aggregate";
import type { CoachReport } from "@/types/ai";

export type CoachStatus = "idle" | "loading" | "error";

interface CoachReportInput {
  totalKgCo2e: number;
  periodDays: number;
  topCategories: CategoryTotal[];
  dailyBudgetKg?: number;
}

/**
 * Owns the `/api/coach` request lifecycle: report data, loading/error status,
 * and a `generate` action. Concurrent calls are ignored while one is in flight.
 *
 * @param input - The emissions context sent to the coach endpoint.
 * @returns The current report, status, error message, and a `generate` fn.
 */
export function useCoachReport(input: CoachReportInput) {
  const [report, setReport] = useState<CoachReport | null>(null);
  const [status, setStatus] = useState<CoachStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function generate() {
    if (status === "loading") return;
    setStatus("loading");
    setErrorMessage(null);
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalKgCo2e: input.totalKgCo2e,
          periodDays: input.periodDays,
          topCategories: input.topCategories.map(({ category, kgCo2e }) => ({
            category,
            kgCo2e,
          })),
          dailyBudgetKg: input.dailyBudgetKg,
        }),
      });
      const data = (await res.json()) as CoachReport | { error: string };
      if (!res.ok || "error" in data) {
        throw new Error(
          "error" in data ? data.error : "Could not generate a report.",
        );
      }
      setReport(data);
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Something went wrong.",
      );
    }
  }

  return { report, status, errorMessage, generate };
}

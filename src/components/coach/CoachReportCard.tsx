"use client";

import { Sprout } from "lucide-react";
import type { CoachReport } from "@/types/ai";
import type { CoachStatus } from "./useCoachReport";

interface CoachReportCardProps {
  status: CoachStatus;
  report: CoachReport | null;
  errorMessage: string | null;
  /** Whether the user has logged any activities yet. */
  hasEntries: boolean;
}

/**
 * The "Vertex AI Analysis" panel. Renders one of four states: loading skeleton,
 * error, empty/idle prompt, or the generated report (summary, encouragement,
 * tips).
 */
export function CoachReportCard({
  status,
  report,
  errorMessage,
  hasEntries,
}: CoachReportCardProps) {
  return (
    <div className="relative flex-1 overflow-hidden rounded-[20px] bg-gradient-to-br from-emerald-800 via-emerald-800 to-emerald-900 p-5 shadow-lg shadow-emerald-900/30 dark:from-emerald-950/90 dark:to-emerald-950/70">
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-emerald-600/10 blur-2xl" />
      <div className="absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-teal-500/10 blur-2xl" />
      <div className="relative mb-3 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600/40 shadow-sm shadow-emerald-500/20">
          <Sprout className="h-4 w-4 text-emerald-300" aria-hidden="true" />
        </div>
        <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
          Vertex AI Analysis
        </span>
      </div>

      {status === "loading" && (
        <>
          <h3 className="mb-4 text-base font-bold text-white">
            Vertex AI Analysis: Weekly Report
          </h3>
          <div className="flex flex-col gap-2.5">
            {[100, 83, 91, 67].map((w) => (
              <div
                key={w}
                style={{ width: `${w}%` }}
                className="h-3 animate-pulse rounded-full bg-emerald-700/60"
              />
            ))}
          </div>
        </>
      )}

      {status === "error" && (
        <p className="text-sm text-red-300">{errorMessage}</p>
      )}

      {status !== "loading" && !report && status !== "error" && (
        <>
          <h3 className="mb-2 text-base font-bold text-white">
            {!hasEntries
              ? "Start tracking to unlock"
              : "Vertex AI Analysis: Weekly Report"}
          </h3>
          <p className="text-sm leading-relaxed text-emerald-100/80">
            {!hasEntries
              ? "🌱 Log a few activities to unlock your personalised carbon coaching report."
              : "✨ Your activity data is ready. Click 'Get report' for a short, encouraging analysis with personalised tips."}
          </p>
        </>
      )}

      {status === "idle" && report && (
        <>
          <h3 className="mb-3 text-base font-bold text-white">
            Vertex AI Analysis: Weekly Report
          </h3>
          <p className="mb-2 text-sm leading-relaxed text-emerald-100">
            {report.summary}
          </p>
          <p className="mb-3 text-sm font-semibold text-emerald-300">
            {report.encouragement}
          </p>
          <ul className="flex flex-col gap-2">
            {report.tips.map((tip, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2.5 rounded-lg bg-white/10 px-3 py-2 text-sm text-emerald-100"
              >
                <Sprout
                  className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300"
                  aria-hidden="true"
                />
                {tip}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

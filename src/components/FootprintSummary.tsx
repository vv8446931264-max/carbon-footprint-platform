import { Target, TrendingDown, TrendingUp } from "lucide-react";
import {
  GLOBAL_AVERAGE_ANNUAL_TONNES,
  PARIS_ALIGNED_DAILY_KG,
  tonnesToKg,
} from "@/lib/emissions/calculate";

interface FootprintSummaryProps {
  totalKgCo2e: number;
  periodDays: number;
  /** Estimated out-of-pocket cost of the logged activities (USD). */
  totalCostUsd?: number;
}

/**
 * Hero stat. Frames the user's footprint against a **science-based,
 * Paris-aligned target (~2 t/year)** rather than only "the average" — the
 * framing credible calculators use — with a progress bar and a plain-language
 * read on how they're tracking. Carbon and money are shown side by side.
 */
export function FootprintSummary({
  totalKgCo2e,
  periodDays,
  totalCostUsd,
}: FootprintSummaryProps) {
  const targetForPeriod = PARIS_ALIGNED_DAILY_KG * periodDays;
  const globalForPeriod =
    (tonnesToKg(GLOBAL_AVERAGE_ANNUAL_TONNES) / 365) * periodDays;

  const targetRatio = targetForPeriod > 0 ? totalKgCo2e / targetForPeriod : 0;
  const pctOfTarget = Math.min(Math.round(targetRatio * 100), 999);
  const barPct = Math.min(targetRatio * 100, 100);
  const underTarget = totalKgCo2e <= targetForPeriod;

  const barColor =
    totalKgCo2e === 0
      ? "bg-stone-300 dark:bg-stone-700"
      : underTarget
        ? "bg-emerald-500"
        : targetRatio <= 1.5
          ? "bg-amber-500"
          : "bg-rose-500";

  let context: string;
  if (totalKgCo2e === 0) {
    context =
      "Log an activity to see how you're tracking against a Paris-aligned, ~2-tonne-a-year lifestyle.";
  } else if (underTarget) {
    context = `On track — you're within the Paris-aligned target for these ${periodDays} days, and about ${Math.round(
      (1 - totalKgCo2e / globalForPeriod) * 100,
    )}% below the global average.`;
  } else {
    context = `That's ${pctOfTarget}% of the Paris-aligned target for this period. Small swaps below can close the gap.`;
  }

  return (
    <section
      aria-labelledby="footprint-summary-heading"
      className="relative overflow-hidden rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900 sm:p-7"
    >
      <div className="flex items-center justify-between gap-3">
        <h2
          id="footprint-summary-heading"
          className="text-sm font-medium text-stone-500 dark:text-stone-400"
        >
          Your footprint · last {periodDays} day{periodDays === 1 ? "" : "s"}
        </h2>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
          <Target className="h-3.5 w-3.5" aria-hidden="true" />
          Goal: 2 t/yr
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-end gap-x-4 gap-y-1">
        <span className="text-5xl font-bold tracking-tight tabular-nums text-stone-900 dark:text-stone-50">
          {totalKgCo2e.toFixed(1)}
        </span>
        <span className="pb-1 text-lg text-stone-500 dark:text-stone-400">
          kg CO₂e
        </span>
        {totalCostUsd !== undefined && totalCostUsd > 0 && (
          <span className="ml-auto pb-1 text-sm font-medium tabular-nums text-stone-500 dark:text-stone-400">
            ≈ ${totalCostUsd.toFixed(2)} spent
          </span>
        )}
      </div>

      <div className="mt-5">
        <div className="mb-1.5 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
          <span>Target for this period</span>
          <span className="tabular-nums">{targetForPeriod.toFixed(0)} kg</span>
        </div>
        <div
          className="h-2.5 w-full overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(barPct)}
          aria-label={`${pctOfTarget}% of the Paris-aligned carbon target for this period`}
        >
          <div
            className={`h-full rounded-full transition-[width] duration-500 ${barColor}`}
            style={{ width: `${barPct}%` }}
          />
        </div>
      </div>

      <p className="mt-4 flex items-start gap-2 text-sm text-stone-600 dark:text-stone-300">
        {totalKgCo2e > 0 &&
          (underTarget ? (
            <TrendingDown
              className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
              aria-hidden="true"
            />
          ) : (
            <TrendingUp
              className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400"
              aria-hidden="true"
            />
          ))}
        <span>{context}</span>
      </p>
    </section>
  );
}

import { Target, TrendingDown, TrendingUp } from "lucide-react";
import {
  GLOBAL_AVERAGE_ANNUAL_TONNES,
  PARIS_ALIGNED_ANNUAL_TONNES,
} from "@/lib/emissions/calculate";

interface FootprintSummaryProps {
  totalKgCo2e: number;
  periodDays: number;
  /** Estimated out-of-pocket cost of the logged activities (USD). */
  totalCostUsd?: number;
}

/** Upper bound of the comparison scale, in tonnes/year. Comfortably clears the
 *  4.7 t global average so both reference markers sit inside the track. */
const SCALE_MAX_TONNES = 6;

/**
 * Hero stat. Frames the user's footprint against a **science-based,
 * Paris-aligned target (~2 t/year)** rather than only "the average". The period
 * total is extrapolated to an annual *pace* and plotted on a single scale next
 * to the 2 t target and the 4.7 t global average — turning an abstract kg number
 * into an at-a-glance "where do I stand?". Carbon and money are shown together.
 */
export function FootprintSummary({
  totalKgCo2e,
  periodDays,
  totalCostUsd,
}: FootprintSummaryProps) {
  const hasData = totalKgCo2e > 0;

  // Annualised pace: extrapolate the period total to a yearly figure so it
  // speaks the same language as the 2 t target and 4.7 t average.
  const annualizedTonnes =
    periodDays > 0 ? ((totalKgCo2e / periodDays) * 365) / 1000 : 0;
  const underTarget = annualizedTonnes <= PARIS_ALIGNED_ANNUAL_TONNES;
  const vsAveragePct = Math.round(
    (1 - annualizedTonnes / GLOBAL_AVERAGE_ANNUAL_TONNES) * 100,
  );

  const tone = !hasData
    ? "stone"
    : underTarget
      ? "emerald"
      : annualizedTonnes <= GLOBAL_AVERAGE_ANNUAL_TONNES
        ? "amber"
        : "rose";
  const fillColor = {
    stone: "bg-stone-300 dark:bg-stone-700",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
  }[tone];
  const paceChip = {
    stone: "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300",
    emerald:
      "bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300",
    amber:
      "bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300",
    rose: "bg-rose-50 text-rose-800 dark:bg-rose-500/10 dark:text-rose-300",
  }[tone];

  const pos = (tonnes: number) =>
    Math.min(Math.max(tonnes / SCALE_MAX_TONNES, 0), 1) * 100;
  const userPct = pos(annualizedTonnes);
  const targetPct = pos(PARIS_ALIGNED_ANNUAL_TONNES);
  const avgPct = pos(GLOBAL_AVERAGE_ANNUAL_TONNES);

  let context: string;
  if (!hasData) {
    context =
      "Log an activity to see how you're tracking against a Paris-aligned, ~2-tonne-a-year lifestyle.";
  } else if (underTarget) {
    context = `On track — at this pace you'd stay within the Paris-aligned 2 t/year target${
      vsAveragePct > 0
        ? `, about ${vsAveragePct}% below the global average`
        : ""
    }.`;
  } else {
    context = `That's about ${(
      annualizedTonnes / PARIS_ALIGNED_ANNUAL_TONNES
    ).toFixed(1)}× the 2 t target${
      vsAveragePct > 0 ? ` and ${vsAveragePct}% below the global average` : ""
    }. Small swaps below can close the gap.`;
  }

  const scaleLabel = hasData
    ? `At this pace, about ${annualizedTonnes.toFixed(
        1,
      )} tonnes CO2e per year. The Paris-aligned target is 2 tonnes; the global average is 4.7 tonnes.`
    : "Annual pace scale. The Paris-aligned target is 2 tonnes; the global average is 4.7 tonnes.";

  return (
    <section
      aria-labelledby="footprint-summary-heading"
      className="relative overflow-hidden rounded-2xl border border-stone-200 bg-gradient-to-br from-white via-white to-emerald-50/60 p-6 shadow-sm dark:border-stone-800 dark:from-stone-900 dark:via-stone-900 dark:to-emerald-950/20 sm:p-7"
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
        <div className="mb-2 flex items-baseline justify-between gap-2 text-xs text-stone-500 dark:text-stone-400">
          <span>At this pace</span>
          {hasData ? (
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${paceChip}`}
            >
              ≈ {annualizedTonnes.toFixed(1)} t/yr
            </span>
          ) : (
            <span className="text-stone-400 dark:text-stone-500">
              awaiting your first log
            </span>
          )}
        </div>

        {/* You vs target vs average, on one scale. */}
        <div
          className="relative h-3 w-full rounded-full bg-stone-100 dark:bg-stone-800"
          role="img"
          aria-label={scaleLabel}
        >
          <div
            className={`absolute inset-y-0 left-0 rounded-full transition-[width] duration-500 ${fillColor}`}
            style={{ width: `${userPct}%` }}
          />
          {/* Target marker (2 t) */}
          <div
            className="absolute -inset-y-0.5 w-0.5 rounded bg-emerald-700 dark:bg-emerald-400"
            style={{ left: `${targetPct}%` }}
            aria-hidden="true"
          />
          {/* Global-average marker (4.7 t) */}
          <div
            className="absolute -inset-y-0.5 w-0.5 rounded bg-stone-400 dark:bg-stone-500"
            style={{ left: `${avgPct}%` }}
            aria-hidden="true"
          />
        </div>
        <div
          className="relative mt-1.5 h-4 text-[10px] text-stone-500 dark:text-stone-400"
          aria-hidden="true"
        >
          <span
            className="absolute -translate-x-1/2 whitespace-nowrap font-medium text-emerald-700 dark:text-emerald-400"
            style={{ left: `${targetPct}%` }}
          >
            Target 2t
          </span>
          <span
            className="absolute -translate-x-1/2 whitespace-nowrap"
            style={{ left: `${avgPct}%` }}
          >
            Avg 4.7t
          </span>
        </div>
      </div>

      <p className="mt-4 flex items-start gap-2 text-sm text-stone-600 dark:text-stone-300">
        {hasData &&
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

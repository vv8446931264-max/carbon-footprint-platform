import { Target, TrendingDown, TrendingUp } from "lucide-react";
import {
  INDIA_URBAN_AVERAGE_ANNUAL_TONNES,
  PARIS_ALIGNED_ANNUAL_TONNES,
} from "@/lib/emissions/calculate";
import { EmissionEquivalencies } from "./EmissionEquivalencies";

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
    (1 - annualizedTonnes / INDIA_URBAN_AVERAGE_ANNUAL_TONNES) * 100,
  );

  const tone = !hasData
    ? "stone"
    : underTarget
      ? "emerald"
      : annualizedTonnes <= INDIA_URBAN_AVERAGE_ANNUAL_TONNES
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
  const avgPct = pos(INDIA_URBAN_AVERAGE_ANNUAL_TONNES);

  let context: string;
  if (!hasData) {
    context =
      "Log an activity to see how you're tracking against a Paris-aligned, ~2-tonne-a-year lifestyle.";
  } else if (underTarget) {
    context = `On track. At this pace you'd stay within the Paris-aligned 2 t/year target${
      vsAveragePct > 0
        ? `, about ${vsAveragePct}% below the urban India average`
        : ""
    }.`;
  } else {
    context = `That's about ${(
      annualizedTonnes / PARIS_ALIGNED_ANNUAL_TONNES
    ).toFixed(1)}× the 2 t target${
      vsAveragePct > 0
        ? ` and ${vsAveragePct}% below the urban India average`
        : ` — above the urban India average of ~4.5 t`
    }. Small swaps below can close the gap.`;
  }

  const scaleLabel = hasData
    ? `At this pace, about ${annualizedTonnes.toFixed(
        1,
      )} tonnes CO2e per year. The Paris-aligned target is 2 tonnes; the urban India average is 4.5 tonnes.`
    : "Annual pace scale. The Paris-aligned target is 2 tonnes; the urban India average is 4.5 tonnes.";

  const heroNumberColor = {
    stone: "text-stone-700 dark:text-stone-300",
    emerald: "text-emerald-700 dark:text-emerald-400",
    amber: "text-amber-700 dark:text-amber-400",
    rose: "text-rose-700 dark:text-rose-400",
  }[tone];

  const glowColor = {
    stone: "",
    emerald: "shadow-emerald-500/20",
    amber: "shadow-amber-500/20",
    rose: "shadow-rose-500/20",
  }[tone];

  return (
    <section
      aria-labelledby="footprint-summary-heading"
      className="relative overflow-hidden rounded-[20px] border border-emerald-100/80 bg-gradient-to-br from-white via-emerald-50/30 to-white p-6 shadow-[var(--shadow-soft)] dark:border-emerald-900/30 dark:from-stone-900 dark:via-emerald-950/20 dark:to-stone-900 sm:p-8"
    >
      {/* Decorative organic blob — purely visual */}
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-400/8 blur-3xl dark:bg-emerald-500/5"
        aria-hidden="true"
      />

      <div className="flex items-start justify-between gap-3">
        <h2
          id="footprint-summary-heading"
          className="text-sm font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400"
        >
          Your footprint · last {periodDays} day{periodDays === 1 ? "" : "s"}
        </h2>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/70 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-950/60 dark:text-emerald-300">
          <Target className="h-3 w-3" aria-hidden="true" />
          Goal: 2 t/yr
        </span>
      </div>

      {/* Hero number */}
      <div className="mt-4 flex flex-wrap items-end gap-x-3 gap-y-1">
        <span
          className={`text-6xl font-extrabold tracking-tight tabular-nums transition-colors duration-300 sm:text-7xl ${heroNumberColor}`}
        >
          {totalKgCo2e.toFixed(1)}
        </span>
        <div className="flex flex-col pb-2">
          <span className="text-base font-medium text-stone-500 dark:text-stone-400">
            kg CO₂e
          </span>
          {totalCostUsd !== undefined && totalCostUsd > 0 && (
            <span className="text-xs font-medium tabular-nums text-stone-400 dark:text-stone-500">
              ≈ ${totalCostUsd.toFixed(2)} spent
            </span>
          )}
        </div>

        {hasData && (
          <span
            className={`ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold tabular-nums shadow-md ${glowColor} ${paceChip}`}
          >
            ≈ {annualizedTonnes.toFixed(1)} t/yr
          </span>
        )}
      </div>

      {/* Progress scale */}
      <div className="mt-6">
        {!hasData && (
          <p className="mb-2 text-xs text-stone-400 dark:text-stone-500">
            awaiting your first log
          </p>
        )}

        <div
          className="relative h-4 w-full overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800/80"
          role="img"
          aria-label={scaleLabel}
        >
          <div
            className={`absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-out ${fillColor}`}
            style={{ width: `${userPct}%` }}
          />
          {/* Subtle shine on the bar */}
          <div
            className="pointer-events-none absolute inset-y-0 left-0 right-1/2 rounded-full bg-white/20"
            style={{ width: `${userPct * 0.5}%` }}
            aria-hidden="true"
          />
          {/* Target marker (2 t) */}
          <div
            className="absolute inset-y-0 w-0.5 rounded-full bg-emerald-700 dark:bg-emerald-400"
            style={{ left: `${targetPct}%` }}
            aria-hidden="true"
          />
          {/* India average marker */}
          <div
            className="absolute inset-y-0 w-0.5 rounded-full bg-stone-400/70 dark:bg-stone-500"
            style={{ left: `${avgPct}%` }}
            aria-hidden="true"
          />
        </div>

        <div
          className="relative mt-2 h-4 text-[10px] font-medium text-stone-500 dark:text-stone-400"
          aria-hidden="true"
        >
          <span
            className="absolute -translate-x-1/2 whitespace-nowrap text-emerald-700 dark:text-emerald-400"
            style={{ left: `${targetPct}%` }}
          >
            Target 2t
          </span>
          <span
            className="absolute -translate-x-1/2 whitespace-nowrap"
            style={{ left: `${avgPct}%` }}
          >
            India avg 4.5t
          </span>
        </div>
      </div>

      {/* Context sentence */}
      <p className="mt-5 flex items-start gap-2 rounded-xl bg-stone-50/80 px-4 py-3 text-sm text-stone-700 dark:bg-stone-800/50 dark:text-stone-300">
        {hasData &&
          (underTarget ? (
            <TrendingDown
              className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
              aria-hidden="true"
            />
          ) : (
            <TrendingUp
              className="mt-0.5 h-4 w-4 shrink-0 text-amber-500 dark:text-amber-400"
              aria-hidden="true"
            />
          ))}
        <span>{context}</span>
      </p>

      {hasData && (
        <div className="mt-5 border-t border-stone-100 pt-5 dark:border-stone-800">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
            That&apos;s equivalent to…
          </p>
          <EmissionEquivalencies kgCo2e={totalKgCo2e} />
        </div>
      )}
    </section>
  );
}

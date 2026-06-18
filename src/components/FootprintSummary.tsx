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

const SCALE_MAX_TONNES = 6;

export function FootprintSummary({
  totalKgCo2e,
  periodDays,
  totalCostUsd,
}: FootprintSummaryProps) {
  const hasData = totalKgCo2e > 0;

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

  // All colors tuned for the dark #11422A hero background
  const heroNumberColor = {
    stone: "text-white",
    emerald: "text-emerald-300",
    amber: "text-amber-300",
    rose: "text-rose-300",
  }[tone];

  const glowColor = {
    stone: "shadow-white/10",
    emerald: "shadow-emerald-400/30",
    amber: "shadow-amber-400/30",
    rose: "shadow-rose-400/30",
  }[tone];

  const paceChip = {
    stone: "bg-white/15 text-white",
    emerald: "bg-emerald-500/25 text-emerald-200",
    amber: "bg-amber-500/25 text-amber-200",
    rose: "bg-rose-500/25 text-rose-200",
  }[tone];

  const fillColor = {
    stone: "bg-white/30",
    emerald: "bg-emerald-400",
    amber: "bg-amber-400",
    rose: "bg-rose-400",
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

  return (
    <section
      aria-labelledby="footprint-summary-heading"
      className="relative overflow-hidden rounded-[28px] border border-emerald-400/20 bg-[#11422A] p-6 shadow-[0_0_40px_rgba(16,185,129,0.10)] sm:p-8"
    >
      {/* Decorative organic blob */}
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-400/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="flex items-start justify-between gap-3">
        <h2
          id="footprint-summary-heading"
          className="text-sm font-semibold uppercase tracking-wider text-emerald-200"
        >
          Your footprint · last {periodDays} day{periodDays === 1 ? "" : "s"}
        </h2>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-700/30 px-2.5 py-1 text-xs font-semibold text-emerald-200">
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
          <span className="text-base font-medium text-emerald-200">
            kg CO₂e
          </span>
          {totalCostUsd !== undefined && totalCostUsd > 0 && (
            <span className="text-xs font-medium tabular-nums text-emerald-300/70">
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
          <p className="mb-2 text-xs text-emerald-300/60">
            awaiting your first log
          </p>
        )}

        <div
          className="relative h-4 w-full overflow-hidden rounded-full bg-emerald-900/70"
          role="img"
          aria-label={scaleLabel}
        >
          <div
            className={`absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-out ${fillColor}`}
            style={{ width: `${userPct}%` }}
          />
          <div
            className="pointer-events-none absolute inset-y-0 left-0 right-1/2 rounded-full bg-white/15"
            style={{ width: `${userPct * 0.5}%` }}
            aria-hidden="true"
          />
          {/* Target marker (2 t) */}
          <div
            className="absolute inset-y-0 w-0.5 rounded-full bg-emerald-400"
            style={{ left: `${targetPct}%` }}
            aria-hidden="true"
          />
          {/* India average marker */}
          <div
            className="absolute inset-y-0 w-0.5 rounded-full bg-emerald-700/50"
            style={{ left: `${avgPct}%` }}
            aria-hidden="true"
          />
        </div>

        <div
          className="relative mt-2 h-4 text-[10px] font-medium text-emerald-300"
          aria-hidden="true"
        >
          <span
            className="absolute -translate-x-1/2 whitespace-nowrap text-emerald-300"
            style={{ left: `${targetPct}%` }}
          >
            Target 2t
          </span>
          <span
            className="absolute -translate-x-1/2 whitespace-nowrap text-emerald-400/70"
            style={{ left: `${avgPct}%` }}
          >
            India avg 4.5t
          </span>
        </div>
      </div>

      {/* Context sentence */}
      <p className="mt-5 flex items-start gap-2 rounded-xl bg-emerald-900/50 px-4 py-3 text-sm text-emerald-100">
        {hasData &&
          (underTarget ? (
            <TrendingDown
              className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400"
              aria-hidden="true"
            />
          ) : (
            <TrendingUp
              className="mt-0.5 h-4 w-4 shrink-0 text-amber-300"
              aria-hidden="true"
            />
          ))}
        <span>{context}</span>
      </p>

      {hasData && (
        <div className="mt-5 border-t border-emerald-700/40 pt-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-emerald-300">
            That&apos;s equivalent to…
          </p>
          <EmissionEquivalencies kgCo2e={totalKgCo2e} />
        </div>
      )}
    </section>
  );
}

import {
  GLOBAL_AVERAGE_ANNUAL_TONNES,
  tonnesToKg,
} from "@/lib/emissions/calculate";

interface FootprintSummaryProps {
  totalKgCo2e: number;
  periodDays: number;
  /** Estimated out-of-pocket cost of the logged activities (USD). */
  totalCostUsd?: number;
}

/**
 * Headline number plus a plain-language comparison against the global
 * per-capita average — gives people an intuitive sense of scale rather
 * than a bare kilogram figure. Also surfaces the estimated dollar cost so
 * carbon and money are always shown side by side.
 */
export function FootprintSummary({
  totalKgCo2e,
  periodDays,
  totalCostUsd,
}: FootprintSummaryProps) {
  const dailyAverageGlobal = tonnesToKg(GLOBAL_AVERAGE_ANNUAL_TONNES) / 365;
  const expectedForPeriod = dailyAverageGlobal * periodDays;
  const ratio = expectedForPeriod > 0 ? totalKgCo2e / expectedForPeriod : 0;

  const comparisonText =
    ratio === 0
      ? "Log an activity to see how you compare to the global average."
      : ratio < 0.9
        ? `That's about ${Math.round((1 - ratio) * 100)}% below the global average for this period — nice work.`
        : ratio <= 1.1
          ? "That's roughly in line with the global average for this period."
          : `That's about ${Math.round((ratio - 1) * 100)}% above the global average for this period.`;

  return (
    <section
      aria-labelledby="footprint-summary-heading"
      className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <h2
        id="footprint-summary-heading"
        className="text-sm font-medium text-zinc-500 dark:text-zinc-400"
      >
        Your footprint — last {periodDays} day{periodDays === 1 ? "" : "s"}
      </h2>
      <p className="mt-2 flex items-baseline gap-2">
        <span className="text-4xl font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
          {totalKgCo2e.toFixed(1)}
        </span>
        <span className="text-lg text-zinc-500 dark:text-zinc-400">
          kg CO₂e
        </span>
        {totalCostUsd !== undefined && totalCostUsd > 0 && (
          <span className="ml-auto text-sm font-medium tabular-nums text-zinc-500 dark:text-zinc-400">
            ≈ ${totalCostUsd.toFixed(2)}
          </span>
        )}
      </p>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
        {comparisonText}
      </p>
    </section>
  );
}

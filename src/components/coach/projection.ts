const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** The Paris-aligned annual target, in tonnes of CO₂e. */
const TARGET_TONNES = 2;

/**
 * Fraction of annual emissions avoided if the user adopts all suggested swaps.
 * A demo-grade heuristic (40%), not a per-user calculation.
 */
export const SWAP_REDUCTION = 0.4;

export interface ProjectionPoint {
  month: string;
  /** Cumulative annual-pace tonnes at this month, or null when there's no data. */
  current: number | null;
  /** Same, but on the post-swap trajectory; null before it diverges. */
  projected: number | null;
}

export interface Projection {
  chartData: ProjectionPoint[];
  /** Upper bound for the chart's Y axis. */
  yMax: number;
  /** Annualised emissions at the current pace, in tonnes. */
  annualTonnes: number;
  /** Annualised emissions if all swaps are adopted, in tonnes. */
  swapAnnualTonnes: number;
  /** How far below the 2-tonne target the swap trajectory lands, as a percent. */
  goalExceedPct: number;
}

/**
 * Projects annual emissions from a period total and builds the month-by-month
 * series for the impact chart. Pure except for reading the current month to
 * decide where the post-swap line starts diverging.
 *
 * @param totalKgCo2e - Total emissions logged over `periodDays`.
 * @param periodDays - Length of the reporting window in days.
 * @param hasEntries - Whether any activities exist (gates the chart series).
 */
export function buildProjection(
  totalKgCo2e: number,
  periodDays: number,
  hasEntries: boolean,
): Projection {
  const dailyKg = totalKgCo2e / Math.max(periodDays, 1);
  const annualTonnes = (dailyKg * 365) / 1000;
  const swapAnnualTonnes = annualTonnes * (1 - SWAP_REDUCTION);
  const goalExceedPct =
    swapAnnualTonnes > 0 && swapAnnualTonnes < TARGET_TONNES
      ? Math.round(((TARGET_TONNES - swapAnnualTonnes) / TARGET_TONNES) * 100)
      : 0;

  const currentMonthIdx = new Date().getMonth();
  const chartData: ProjectionPoint[] = MONTHS.map((month, i) => {
    const frac = (i + 1) / 12;
    return {
      month,
      current: hasEntries ? +(annualTonnes * frac).toFixed(2) : null,
      projected:
        hasEntries && i >= Math.max(0, currentMonthIdx - 1)
          ? +(swapAnnualTonnes * frac).toFixed(2)
          : null,
    };
  });

  const yMax = hasEntries
    ? Math.max(2.5, Math.ceil(annualTonnes * 1.25 * 4) / 4)
    : 2.5;

  return { chartData, yMax, annualTonnes, swapAnnualTonnes, goalExceedPct };
}

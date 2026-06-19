import type { ActivityCategory, LoggedActivity } from "@/types/activity";

export interface CategoryTotal {
  category: ActivityCategory;
  kgCo2e: number;
}

/**
 * Groups logged activities by category and sums their emissions,
 * sorted from highest to lowest impact. Pure aggregation — no I/O.
 */
export function totalsByCategory(entries: LoggedActivity[]): CategoryTotal[] {
  const totals = new Map<ActivityCategory, number>();

  for (const entry of entries) {
    const category = entry.activity.category;
    totals.set(category, (totals.get(category) ?? 0) + entry.emissionsKgCo2e);
  }

  return Array.from(totals.entries())
    .map(([category, kgCo2e]) => ({ category, kgCo2e: round(kgCo2e) }))
    .sort((a, b) => b.kgCo2e - a.kgCo2e);
}

/**
 * Sums the emissions of every entry, rounded to two decimals.
 *
 * @param entries - Logged activities to total.
 * @returns Combined emissions in kg CO₂e.
 */
export function totalEmissions(entries: LoggedActivity[]): number {
  return round(entries.reduce((sum, entry) => sum + entry.emissionsKgCo2e, 0));
}

/**
 * Filters entries to those logged within the trailing day window.
 *
 * @param entries - Logged activities to filter.
 * @param days - Number of trailing days to keep, counting back from now.
 * @returns Entries whose `loggedAt` falls inside the window.
 */
export function entriesWithinDays(
  entries: LoggedActivity[],
  days: number,
): LoggedActivity[] {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return entries.filter(
    (entry) => new Date(entry.loggedAt).getTime() >= cutoff,
  );
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

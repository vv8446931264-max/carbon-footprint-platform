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

export function totalEmissions(entries: LoggedActivity[]): number {
  return round(entries.reduce((sum, entry) => sum + entry.emissionsKgCo2e, 0));
}

export function entriesWithinDays(entries: LoggedActivity[], days: number): LoggedActivity[] {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return entries.filter((entry) => new Date(entry.loggedAt).getTime() >= cutoff);
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

import type { LoggedActivity } from "@/types/activity";

export interface WeeklyTotal {
  /** ISO date (YYYY-MM-DD) of the Monday that starts this week. */
  weekStart: string;
  kgCo2e: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Buckets logged activities into the last `weeks` calendar weeks (Monday-based)
 * so the UI can show whether a person's footprint is trending *down* over time —
 * the signal that matters most for the "reduce" goal. Weeks with no activity are
 * included as zeros so the trend line is continuous rather than gappy.
 *
 * Pure aggregation, no I/O — fully unit-testable with an injected `now`.
 */
export function weeklyTrend(
  entries: LoggedActivity[],
  weeks = 8,
  now: Date = new Date(),
): WeeklyTotal[] {
  const currentMonday = startOfWeek(now);

  // Build the (empty) buckets oldest → newest first so order is deterministic.
  const buckets: WeeklyTotal[] = [];
  const startKeys: number[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const start = new Date(currentMonday.getTime() - i * 7 * DAY_MS);
    buckets.push({ weekStart: toDateKey(start), kgCo2e: 0 });
    startKeys.push(start.getTime());
  }

  const earliest = startKeys[0];
  for (const entry of entries) {
    const time = new Date(entry.loggedAt).getTime();
    if (Number.isNaN(time) || time < earliest) continue;
    const monday = startOfWeek(new Date(time)).getTime();
    const index = startKeys.indexOf(monday);
    if (index >= 0) buckets[index].kgCo2e += entry.emissionsKgCo2e;
  }

  return buckets.map((b) => ({ ...b, kgCo2e: round(b.kgCo2e) }));
}

/** Midnight on the Monday of the week containing `date` (local time). */
function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  // getDay(): 0 = Sunday … 6 = Saturday. Shift so Monday is the start.
  const offset = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - offset);
  return d;
}

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

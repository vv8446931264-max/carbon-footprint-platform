/**
 * Local calendar-day keys.
 *
 * `isoString.slice(0, 10)` produces the **UTC** date — so for anyone east of
 * UTC (e.g. India, UTC+5:30) an activity logged at 1 a.m. lands on
 * *yesterday's* budget, and the streak/"today" math is off by one day.
 * These helpers derive the key from local date components instead.
 */
export function localDayKey(input: Date | string): string {
  const d = typeof input === "string" ? new Date(input) : input;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

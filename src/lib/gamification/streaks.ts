import type { LoggedActivity } from "@/types/activity";

export interface DailyTotal {
  /** ISO date string, e.g. "2026-06-08" */
  date: string;
  kgCo2e: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
}

/**
 * Groups logged activities into per-day totals (local calendar days),
 * sorted oldest → newest. Pure aggregation — no I/O, fully testable.
 */
export function dailyTotals(entries: LoggedActivity[]): DailyTotal[] {
  const totals = new Map<string, number>();

  for (const entry of entries) {
    const date = toDateKey(entry.loggedAt);
    totals.set(date, (totals.get(date) ?? 0) + entry.emissionsKgCo2e);
  }

  return Array.from(totals.entries())
    .map(([date, kgCo2e]) => ({ date, kgCo2e: round(kgCo2e) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Counts the current streak of consecutive days (ending today or yesterday)
 * where total emissions stayed at or below the daily budget. A gap of more
 * than one day, or a day over budget, breaks the streak.
 */
export function currentStreak(
  entries: LoggedActivity[],
  dailyBudgetKg: number,
  now: Date = new Date(),
): number {
  if (dailyBudgetKg <= 0) return 0;

  const totals = new Map(dailyTotals(entries).map((d) => [d.date, d.kgCo2e]));
  let streak = 0;
  const cursor = new Date(now);
  cursor.setHours(0, 0, 0, 0);

  // If today has no entries yet, start counting from yesterday so logging
  // hasn't happened yet today doesn't immediately zero the streak.
  if (!totals.has(toDateKey(cursor.toISOString()))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (true) {
    const key = toDateKey(cursor.toISOString());
    const total = totals.get(key);
    if (total === undefined || total > dailyBudgetKg) break;

    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

const ACHIEVEMENT_DEFINITIONS: Array<
  Achievement & { unlocksAt: (ctx: AchievementContext) => boolean }
> = [
  {
    id: "first-log",
    title: "First Step",
    description: "Logged your first activity.",
    icon: "🌱",
    unlocksAt: ({ entryCount }) => entryCount >= 1,
  },
  {
    id: "ten-logs",
    title: "Habit Forming",
    description: "Logged 10 activities.",
    icon: "📒",
    unlocksAt: ({ entryCount }) => entryCount >= 10,
  },
  {
    id: "three-day-streak",
    title: "On a Roll",
    description: "Stayed under your daily budget for 3 days running.",
    icon: "🔥",
    unlocksAt: ({ streak }) => streak >= 3,
  },
  {
    id: "week-streak",
    title: "Green Week",
    description: "Stayed under your daily budget for 7 days running.",
    icon: "🏆",
    unlocksAt: ({ streak }) => streak >= 7,
  },
  {
    id: "swap-spotter",
    title: "Swap Spotter",
    description: "Logged a trip that had a lower-carbon alternative.",
    icon: "🔄",
    unlocksAt: ({ hasSwappableEntry }) => hasSwappableEntry,
  },
];

interface AchievementContext {
  entryCount: number;
  streak: number;
  hasSwappableEntry: boolean;
}

/**
 * Returns the achievements a person has unlocked given their current activity.
 * Defined declaratively so adding a new badge is a one-line change.
 */
export function unlockedAchievements(
  context: AchievementContext,
): Achievement[] {
  return ACHIEVEMENT_DEFINITIONS.filter((def) => def.unlocksAt(context)).map(
    ({ id, title, description, icon }) => ({ id, title, description, icon }),
  );
}

export function allAchievements(): Achievement[] {
  return ACHIEVEMENT_DEFINITIONS.map(({ id, title, description, icon }) => ({
    id,
    title,
    description,
    icon,
  }));
}

function toDateKey(isoString: string): string {
  return isoString.slice(0, 10);
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

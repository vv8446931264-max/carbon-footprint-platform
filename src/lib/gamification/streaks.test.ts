import { describe, expect, it } from "vitest";
import {
  allAchievements,
  currentStreak,
  dailyTotals,
  unlockedAchievements,
} from "./streaks";
import type { LoggedActivity } from "@/types/activity";

function entry(isoDate: string, kg: number): LoggedActivity {
  return {
    id: `${isoDate}-${kg}`,
    loggedAt: `${isoDate}T08:00:00.000Z`,
    description: "test",
    activity: { category: "transport", mode: "bus", distanceKm: 1 },
    emissionsKgCo2e: kg,
  };
}

describe("dailyTotals", () => {
  it("groups and sums entries by calendar day, sorted ascending", () => {
    const totals = dailyTotals([
      entry("2026-06-01", 2),
      entry("2026-06-03", 1),
      entry("2026-06-01", 3),
    ]);
    expect(totals).toEqual([
      { date: "2026-06-01", kgCo2e: 5 },
      { date: "2026-06-03", kgCo2e: 1 },
    ]);
  });
});

describe("currentStreak", () => {
  const now = new Date("2026-06-08T12:00:00.000Z");

  it("counts consecutive under-budget days ending yesterday when today has no entries", () => {
    const entries = [
      entry("2026-06-07", 2),
      entry("2026-06-06", 3),
      entry("2026-06-05", 4),
    ];
    expect(currentStreak(entries, 5, now)).toBe(3);
  });

  it("stops the streak at the first over-budget day", () => {
    const entries = [
      entry("2026-06-07", 2),
      entry("2026-06-06", 9),
      entry("2026-06-05", 1),
    ];
    expect(currentStreak(entries, 5, now)).toBe(1);
  });

  it("stops the streak at a gap day", () => {
    const entries = [entry("2026-06-07", 2), entry("2026-06-05", 1)];
    expect(currentStreak(entries, 5, now)).toBe(1);
  });

  it("returns 0 for a non-positive budget", () => {
    expect(currentStreak([entry("2026-06-07", 1)], 0, now)).toBe(0);
  });

  it("returns 0 when there is no recent activity", () => {
    expect(currentStreak([entry("2026-05-01", 1)], 5, now)).toBe(0);
  });
});

describe("unlockedAchievements", () => {
  it("unlocks achievements whose conditions are met", () => {
    const unlocked = unlockedAchievements({
      entryCount: 10,
      streak: 7,
      hasSwappableEntry: true,
    });
    const ids = unlocked.map((a) => a.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        "first-log",
        "ten-logs",
        "three-day-streak",
        "week-streak",
        "swap-spotter",
      ]),
    );
  });

  it("only unlocks what conditions allow", () => {
    const unlocked = unlockedAchievements({
      entryCount: 1,
      streak: 0,
      hasSwappableEntry: false,
    });
    expect(unlocked.map((a) => a.id)).toEqual(["first-log"]);
  });

  it("matches the full achievement catalogue length when everything is met", () => {
    const unlocked = unlockedAchievements({
      entryCount: 100,
      streak: 100,
      hasSwappableEntry: true,
    });
    expect(unlocked).toHaveLength(allAchievements().length);
  });
});

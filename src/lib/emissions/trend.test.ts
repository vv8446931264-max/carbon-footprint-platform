import { describe, expect, it } from "vitest";
import type { LoggedActivity } from "@/types/activity";
import { weeklyTrend } from "./trend";

// 2026-06-08 is a Monday, so startOfWeek(now) === that date — handy for asserting
// exactly which weekly bucket each entry falls into.
const NOW = new Date("2026-06-08T12:00:00");

function entry(loggedAt: string, kg: number): LoggedActivity {
  return {
    id: loggedAt,
    loggedAt,
    description: "test",
    activity: { category: "transport", mode: "car_petrol", distanceKm: 1 },
    emissionsKgCo2e: kg,
  };
}

describe("weeklyTrend", () => {
  it("returns exactly `weeks` buckets, oldest → newest, even with no data", () => {
    const result = weeklyTrend([], 4, NOW);
    expect(result).toHaveLength(4);
    expect(result.map((r) => r.weekStart)).toEqual([
      "2026-05-18",
      "2026-05-25",
      "2026-06-01",
      "2026-06-08",
    ]);
    expect(result.every((r) => r.kgCo2e === 0)).toBe(true);
  });

  it("places entries in the correct week and sums within a week", () => {
    const result = weeklyTrend(
      [
        entry("2026-06-08T09:00:00", 2), // current week
        entry("2026-06-08T18:00:00", 3), // current week (same bucket)
        entry("2026-06-02T10:00:00", 5), // week of June 1
        entry("2026-05-26T10:00:00", 1), // week of May 25
      ],
      4,
      NOW,
    );
    const byWeek = Object.fromEntries(
      result.map((r) => [r.weekStart, r.kgCo2e]),
    );
    expect(byWeek["2026-06-08"]).toBe(5);
    expect(byWeek["2026-06-01"]).toBe(5);
    expect(byWeek["2026-05-25"]).toBe(1);
    expect(byWeek["2026-05-18"]).toBe(0);
  });

  it("ignores entries older than the window", () => {
    const result = weeklyTrend([entry("2026-04-01T10:00:00", 99)], 4, NOW);
    expect(result.reduce((sum, r) => sum + r.kgCo2e, 0)).toBe(0);
  });
});

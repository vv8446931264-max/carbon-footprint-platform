import { describe, expect, it } from "vitest";
import {
  entriesWithinDays,
  totalEmissions,
  totalsByCategory,
} from "./aggregate";
import type { LoggedActivity } from "@/types/activity";

function entry(
  category: LoggedActivity["activity"]["category"],
  kg: number,
  daysAgo = 0,
): LoggedActivity {
  const loggedAt = new Date(
    Date.now() - daysAgo * 24 * 60 * 60 * 1000,
  ).toISOString();
  return {
    id: `${category}-${kg}-${daysAgo}`,
    loggedAt,
    description: "test entry",
    activity:
      category === "transport"
        ? { category: "transport", mode: "bus", distanceKm: 1 }
        : { category: "energy", source: "grid_electricity", amountKwh: 1 },
    emissionsKgCo2e: kg,
  };
}

describe("totalsByCategory", () => {
  it("sums emissions per category and sorts descending", () => {
    const totals = totalsByCategory([
      entry("transport", 5),
      entry("energy", 9),
      entry("transport", 3),
    ]);
    expect(totals).toEqual([
      { category: "energy", kgCo2e: 9 },
      { category: "transport", kgCo2e: 8 },
    ]);
  });

  it("returns an empty array for no entries", () => {
    expect(totalsByCategory([])).toEqual([]);
  });
});

describe("totalEmissions", () => {
  it("sums all entries", () => {
    expect(
      totalEmissions([entry("transport", 1.5), entry("energy", 2.25)]),
    ).toBe(3.75);
  });
});

describe("entriesWithinDays", () => {
  it("filters out entries older than the window", () => {
    const recent = entry("transport", 1, 1);
    const old = entry("transport", 1, 30);
    expect(entriesWithinDays([recent, old], 7)).toEqual([recent]);
  });
});

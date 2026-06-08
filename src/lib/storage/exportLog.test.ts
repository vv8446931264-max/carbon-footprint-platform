import { describe, expect, it } from "vitest";
import type { LoggedActivity } from "@/types/activity";
import { buildExportBundle, serializeLog } from "./exportLog";

const entry: LoggedActivity = {
  id: "1",
  loggedAt: "2026-01-01T10:00:00.000Z",
  description: "Drove 10km",
  activity: { category: "transport", mode: "car_petrol", distanceKm: 10 },
  emissionsKgCo2e: 1.92,
};

describe("exportLog", () => {
  it("wraps entries in a versioned, timestamped envelope", () => {
    const now = new Date("2026-06-09T00:00:00.000Z");
    const bundle = buildExportBundle([entry], now);
    expect(bundle).toEqual({
      app: "Carbon Coach",
      version: 1,
      exportedAt: "2026-06-09T00:00:00.000Z",
      entryCount: 1,
      entries: [entry],
    });
  });

  it("serializes to valid, round-trippable JSON", () => {
    const json = serializeLog([entry], new Date("2026-06-09T00:00:00.000Z"));
    const parsed = JSON.parse(json);
    expect(parsed.entryCount).toBe(1);
    expect(parsed.entries[0].id).toBe("1");
  });

  it("handles an empty log", () => {
    const bundle = buildExportBundle([]);
    expect(bundle.entryCount).toBe(0);
    expect(bundle.entries).toEqual([]);
  });
});

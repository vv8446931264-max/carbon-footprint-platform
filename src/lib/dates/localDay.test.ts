import { describe, expect, it } from "vitest";
import { localDayKey } from "./localDay";

describe("localDayKey", () => {
  it("uses local date components, not the UTC slice", () => {
    const d = new Date(2026, 5, 10, 1, 30); // 01:30 local on June 10
    expect(localDayKey(d)).toBe("2026-06-10");
    // The UTC slice would disagree for any timezone ahead of UTC.
  });

  it("accepts ISO strings and keys them in local time", () => {
    const iso = new Date(2026, 0, 1, 0, 5).toISOString();
    expect(localDayKey(iso)).toBe("2026-01-01");
  });

  it("pads single-digit months and days", () => {
    expect(localDayKey(new Date(2026, 2, 4))).toBe("2026-03-04");
  });
});

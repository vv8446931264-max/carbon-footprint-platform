import { describe, expect, it } from "vitest";
import { loadLog, saveLog } from "./footprintLog";

function memoryStorage(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (_key: string, value: string) => void store.set(_key, value),
    dump: () => store,
  };
}

const KEY = "carbon-footprint-log:v1";

const VALID_ENTRY = {
  id: "1",
  loggedAt: "2026-06-01T08:00:00.000Z",
  description: "Drove 20 km",
  activity: { category: "transport", mode: "car_petrol", distanceKm: 20 },
  emissionsKgCo2e: 3.84,
};

describe("loadLog validation (untrusted localStorage)", () => {
  it("loads valid entries", () => {
    const storage = memoryStorage({ [KEY]: JSON.stringify([VALID_ENTRY]) });
    expect(loadLog(storage)).toHaveLength(1);
  });

  it("drops corrupted entries individually instead of nuking the log", () => {
    const storage = memoryStorage({
      [KEY]: JSON.stringify([
        VALID_ENTRY,
        { ...VALID_ENTRY, id: "2", emissionsKgCo2e: "NaN-as-string" },
        { ...VALID_ENTRY, id: "3", activity: { category: "transport" } },
        "not even an object",
      ]),
    });
    const loaded = loadLog(storage);
    expect(loaded).toHaveLength(1);
    expect(loaded[0]!.id).toBe("1");
  });

  it("returns an empty log for non-array or unparseable payloads", () => {
    expect(loadLog(memoryStorage({ [KEY]: '{"hax": true}' }))).toEqual([]);
    expect(loadLog(memoryStorage({ [KEY]: "{{{{" }))).toEqual([]);
  });

  it("rejects entries with invented enum values (stale or tampered schema)", () => {
    const storage = memoryStorage({
      [KEY]: JSON.stringify([
        {
          ...VALID_ENTRY,
          activity: { category: "transport", mode: "unicorn", distanceKm: 5 },
        },
      ]),
    });
    expect(loadLog(storage)).toEqual([]);
  });
});

describe("saveLog resilience", () => {
  it("falls back to a truncated log when storage throws (quota)", () => {
    let calls = 0;
    const written: string[] = [];
    const storage = {
      setItem: (_key: string, value: string) => {
        calls += 1;
        if (calls === 1) throw new Error("QuotaExceededError");
        written.push(value);
      },
    };
    const entries = Array.from({ length: 300 }, (_, i) => ({
      ...VALID_ENTRY,
      id: String(i),
    }));
    saveLog(entries, storage);
    expect(written).toHaveLength(1);
    expect(JSON.parse(written[0]!)).toHaveLength(100);
  });
});

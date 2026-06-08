import { describe, expect, it } from "vitest";
import { appendEntry, loadLog, saveLog } from "./footprintLog";
import type { LoggedActivity } from "@/types/activity";

function makeEntry(id: string): LoggedActivity {
  return {
    id,
    loggedAt: new Date().toISOString(),
    description: `entry ${id}`,
    activity: { category: "transport", mode: "bus", distanceKm: 5 },
    emissionsKgCo2e: 0.525,
  };
}

class FakeStorage implements Pick<Storage, "getItem" | "setItem"> {
  private store = new Map<string, string>();
  getItem(key: string) {
    return this.store.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.store.set(key, value);
  }
}

describe("footprintLog storage", () => {
  it("returns an empty array when nothing is stored", () => {
    expect(loadLog(new FakeStorage())).toEqual([]);
  });

  it("returns an empty array for corrupted JSON instead of throwing", () => {
    const storage = new FakeStorage();
    storage.setItem("carbon-footprint-log:v1", "{not json");
    expect(loadLog(storage)).toEqual([]);
  });

  it("round-trips entries through save and load", () => {
    const storage = new FakeStorage();
    const entries = [makeEntry("1"), makeEntry("2")];
    saveLog(entries, storage);
    expect(loadLog(storage)).toEqual(entries);
  });

  it("prepends new entries and caps the list length", () => {
    const existing = [makeEntry("old")];
    const updated = appendEntry(existing, makeEntry("new"), 5);
    expect(updated[0].id).toBe("new");
    expect(updated).toHaveLength(2);
  });

  it("trims the log to maxEntries", () => {
    const existing = Array.from({ length: 5 }, (_, i) => makeEntry(`e${i}`));
    const updated = appendEntry(existing, makeEntry("new"), 5);
    expect(updated).toHaveLength(5);
    expect(updated[0].id).toBe("new");
  });
});

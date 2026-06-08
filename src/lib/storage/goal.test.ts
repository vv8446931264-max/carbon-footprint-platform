import { describe, expect, it } from "vitest";
import {
  DEFAULT_DAILY_BUDGET_KG,
  loadDailyBudget,
  saveDailyBudget,
} from "./goal";

class FakeStorage implements Pick<Storage, "getItem" | "setItem"> {
  private store = new Map<string, string>();
  getItem(key: string) {
    return this.store.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.store.set(key, value);
  }
}

describe("goal storage", () => {
  it("returns the default budget when nothing is stored", () => {
    expect(loadDailyBudget(new FakeStorage())).toBe(DEFAULT_DAILY_BUDGET_KG);
  });

  it("round-trips a valid budget", () => {
    const storage = new FakeStorage();
    saveDailyBudget(8.5, storage);
    expect(loadDailyBudget(storage)).toBe(8.5);
  });

  it("falls back to the default for corrupted or invalid values", () => {
    const storage = new FakeStorage();
    storage.setItem("carbon-footprint-goal:v1", "not-a-number");
    expect(loadDailyBudget(storage)).toBe(DEFAULT_DAILY_BUDGET_KG);
  });

  it("ignores attempts to save non-positive budgets", () => {
    const storage = new FakeStorage();
    saveDailyBudget(-5, storage);
    expect(loadDailyBudget(storage)).toBe(DEFAULT_DAILY_BUDGET_KG);
  });
});

import { describe, expect, it } from "vitest";
import {
  BASELINE_QUESTIONS,
  estimateAnnualKg,
  estimateAnnualTonnes,
  isComplete,
  type BaselineAnswers,
} from "./estimate";

describe("baseline estimator", () => {
  it("returns 0 for no answers", () => {
    expect(estimateAnnualKg({})).toBe(0);
    expect(isComplete({})).toBe(false);
  });

  it("sums the selected options' annual contributions", () => {
    const answers: BaselineAnswers = {
      transport: "car", // 2500
      diet: "average", // 2500
      home: "average", // 1800
      flights: "some", // 500
      shopping: "average", // 900
    };
    expect(estimateAnnualKg(answers)).toBe(8200);
    expect(estimateAnnualTonnes(answers)).toBe(8.2);
    expect(isComplete(answers)).toBe(true);
  });

  it("ignores unknown option values", () => {
    expect(estimateAnnualKg({ transport: "teleport" })).toBe(0);
  });

  it("reaches the lowest footprint with the greenest answers", () => {
    const greenest: BaselineAnswers = {
      transport: "active", // 200
      diet: "vegan", // 1500
      home: "small", // 1000
      flights: "none", // 0
      shopping: "low", // 400
    };
    expect(estimateAnnualKg(greenest)).toBe(3100);
  });

  it("exposes five questions, each with at least two options", () => {
    expect(BASELINE_QUESTIONS).toHaveLength(5);
    for (const question of BASELINE_QUESTIONS) {
      expect(question.options.length).toBeGreaterThanOrEqual(2);
    }
  });
});

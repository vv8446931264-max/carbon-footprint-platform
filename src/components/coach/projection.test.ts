import { describe, expect, it } from "vitest";
import { buildProjection, SWAP_REDUCTION } from "./projection";

describe("buildProjection", () => {
  it("annualises a period total and applies the swap reduction", () => {
    // 60 kg over 30 days = 2 kg/day = 0.73 t/yr.
    const { annualTonnes, swapAnnualTonnes } = buildProjection(60, 30, true);
    expect(annualTonnes).toBeCloseTo((2 * 365) / 1000, 5);
    expect(swapAnnualTonnes).toBeCloseTo(annualTonnes * (1 - SWAP_REDUCTION), 5);
  });

  it("reports how far the swap trajectory beats the 2t target", () => {
    // ~0.73 t/yr current → ~0.44 t/yr after a 40% cut → ~78% under target.
    const { goalExceedPct } = buildProjection(60, 30, true);
    expect(goalExceedPct).toBe(78);
  });

  it("does not claim to beat the target when already above it", () => {
    // 1000 kg over 30 days annualises well past 2 t/yr.
    const { goalExceedPct } = buildProjection(1000, 30, true);
    expect(goalExceedPct).toBe(0);
  });

  it("emits a null series and a floor yMax when there are no entries", () => {
    const { chartData, yMax } = buildProjection(0, 30, false);
    expect(chartData).toHaveLength(12);
    expect(chartData.every((p) => p.current === null && p.projected === null)).toBe(
      true,
    );
    expect(yMax).toBe(2.5);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { CoachReportError, generateCoachReport } from "./coach";
import { generateText } from "./vertexClient";

vi.mock("./vertexClient", async () => {
  const actual =
    await vi.importActual<typeof import("./vertexClient")>("./vertexClient");
  // Keep the real extractJson; only stub the network call.
  return { ...actual, generateText: vi.fn() };
});

const mockGenerate = vi.mocked(generateText);

const VALID_REPORT = {
  summary:
    "Over the last 30 days you produced about 42.5 kg CO2e, mostly from transport.",
  encouragement: "You are building a clear picture of your impact. Keep going.",
  tips: [
    "Swap one short car trip a week for the train.",
    "Try one plant-based dinner this week.",
  ],
};

const INPUT = {
  totalKgCo2e: 42.5,
  periodDays: 30,
  topCategories: [
    { category: "transport", kgCo2e: 28.2 },
    { category: "food", kgCo2e: 14.3 },
  ],
};

describe("generateCoachReport", () => {
  beforeEach(() => mockGenerate.mockReset());

  it("returns a schema-validated report for a clean model response", async () => {
    mockGenerate.mockResolvedValue(JSON.stringify(VALID_REPORT));

    const report = await generateCoachReport(INPUT);
    expect(report).toEqual(VALID_REPORT);
    expect(mockGenerate).toHaveBeenCalledTimes(1);
    // The prompt is built from aggregated numbers only.
    expect(mockGenerate.mock.calls[0]![0]).toContain("42.5 kg CO2e");
    expect(mockGenerate.mock.calls[0]![0]).toContain("transport");
  });

  it("tolerates a markdown-fenced JSON reply (real extractJson in play)", async () => {
    mockGenerate.mockResolvedValue(
      "```json\n" + JSON.stringify(VALID_REPORT) + "\n```",
    );

    const report = await generateCoachReport(INPUT);
    expect(report.tips).toHaveLength(2);
  });

  it("throws a CoachReportError with a user-safe message for non-JSON output", async () => {
    mockGenerate.mockResolvedValue("Sorry, I cannot do that.");

    const error = await generateCoachReport(INPUT).catch((e) => e);
    expect(error).toBeInstanceOf(CoachReportError);
    // The user-facing message must never leak internal details.
    expect(error.userMessage).not.toMatch(/json|schema|zod/i);
  });

  it("rejects a reply that fails schema validation (empty tips)", async () => {
    mockGenerate.mockResolvedValue(
      JSON.stringify({ ...VALID_REPORT, tips: [] }),
    );

    await expect(generateCoachReport(INPUT)).rejects.toBeInstanceOf(
      CoachReportError,
    );
  });

  it("rejects invalid input without calling the model", async () => {
    await expect(
      generateCoachReport({ ...INPUT, periodDays: 0 }),
    ).rejects.toBeInstanceOf(CoachReportError);
    expect(mockGenerate).not.toHaveBeenCalled();
  });
});

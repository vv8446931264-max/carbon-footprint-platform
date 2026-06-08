import { beforeEach, describe, expect, it, vi } from "vitest";
import { ActivityParseError, parseActivityFromText } from "./activityParser";
import { generateText } from "./vertexClient";

vi.mock("./vertexClient", async () => {
  const actual =
    await vi.importActual<typeof import("./vertexClient")>("./vertexClient");
  // Keep the real extractJson; only stub the network call.
  return { ...actual, generateText: vi.fn() };
});

const mockGenerate = vi.mocked(generateText);

const VALID = JSON.stringify({
  category: "food",
  description: "had a beef burger",
  confidence: "high",
  activity: { category: "food", food: "beef", quantityKg: 0.2 },
});

describe("parseActivityFromText", () => {
  beforeEach(() => mockGenerate.mockReset());

  it("parses a valid model response", async () => {
    mockGenerate.mockResolvedValue(VALID);
    const result = await parseActivityFromText("had a beef burger");
    expect(result.activity).toEqual({
      category: "food",
      food: "beef",
      quantityKg: 0.2,
    });
    expect(result.confidence).toBe("high");
    expect(mockGenerate).toHaveBeenCalledTimes(1);
  });

  it("recovers via the self-correcting retry when the first reply is unparseable", async () => {
    mockGenerate
      .mockResolvedValueOnce("Sorry, here are a few things you did today…")
      .mockResolvedValueOnce(VALID);

    const result = await parseActivityFromText("had a beef burger");
    expect(result.activity.category).toBe("food");
    expect(mockGenerate).toHaveBeenCalledTimes(2);
  });

  it("throws a user-safe ActivityParseError when both attempts fail", async () => {
    mockGenerate.mockResolvedValue("still not json");
    await expect(parseActivityFromText("nonsense")).rejects.toMatchObject({
      name: "ActivityParseError",
    });
    expect(mockGenerate).toHaveBeenCalledTimes(2);
  });

  it("rejects empty input without calling the model", async () => {
    await expect(parseActivityFromText("   ")).rejects.toBeInstanceOf(
      ActivityParseError,
    );
    expect(mockGenerate).not.toHaveBeenCalled();
  });

  it("rejects an activity whose schema is invalid (bad enum) after retry", async () => {
    mockGenerate.mockResolvedValue(
      JSON.stringify({
        category: "transport",
        description: "rode a unicorn",
        confidence: "high",
        activity: { category: "transport", mode: "unicorn", distanceKm: 5 },
      }),
    );
    await expect(
      parseActivityFromText("rode a unicorn"),
    ).rejects.toBeInstanceOf(ActivityParseError);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { parseReceiptImage, ReceiptParseError } from "./receiptParser";
import { generateFromImage } from "./vertexClient";

vi.mock("./vertexClient", async () => {
  const actual =
    await vi.importActual<typeof import("./vertexClient")>("./vertexClient");
  return { ...actual, generateFromImage: vi.fn() };
});

const mockGenerate = vi.mocked(generateFromImage);

describe("parseReceiptImage", () => {
  beforeEach(() => mockGenerate.mockReset());

  it("maps valid model output into schema-validated items", async () => {
    mockGenerate.mockResolvedValue(
      JSON.stringify({
        sourceLabel: "Grocery receipt",
        items: [
          {
            category: "food",
            description: "Beef mince 500g",
            confidence: "high",
            activity: { category: "food", food: "beef", quantityKg: 0.5 },
          },
        ],
      }),
    );

    const result = await parseReceiptImage("base64data", "image/jpeg");
    expect(result.sourceLabel).toBe("Grocery receipt");
    expect(result.items).toHaveLength(1);
    expect(result.items[0].activity).toEqual({
      category: "food",
      food: "beef",
      quantityKg: 0.5,
    });
  });

  it("drops items whose category disagrees with the nested activity", async () => {
    mockGenerate.mockResolvedValue(
      JSON.stringify({
        sourceLabel: "Mixed",
        items: [
          {
            category: "transport",
            description: "mismatched",
            confidence: "low",
            activity: { category: "food", food: "chicken", quantityKg: 1 },
          },
          {
            category: "food",
            description: "ok",
            confidence: "high",
            activity: { category: "food", food: "chicken", quantityKg: 1 },
          },
        ],
      }),
    );

    const result = await parseReceiptImage("base64data", "image/jpeg");
    expect(result.items).toHaveLength(1);
    expect(result.items[0].description).toBe("ok");
  });

  it("returns an empty list when the model finds nothing", async () => {
    mockGenerate.mockResolvedValue(
      JSON.stringify({ sourceLabel: null, items: [] }),
    );
    const result = await parseReceiptImage("base64data", "image/jpeg");
    expect(result.items).toEqual([]);
  });

  it("throws a ReceiptParseError on non-JSON output", async () => {
    mockGenerate.mockResolvedValue("sorry, I cannot read this");
    await expect(parseReceiptImage("b", "image/png")).rejects.toBeInstanceOf(
      ReceiptParseError,
    );
  });

  it("throws a ReceiptParseError when the schema does not match", async () => {
    mockGenerate.mockResolvedValue(JSON.stringify({ items: [{ nope: true }] }));
    await expect(parseReceiptImage("b", "image/png")).rejects.toBeInstanceOf(
      ReceiptParseError,
    );
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock only the network layer (generateText). The route + the real report
// generator run for real, so this exercises validation, the guardrail path,
// and response shaping — without hitting Vertex AI.
vi.mock("@/lib/ai/vertexClient", async () => {
  const actual = await vi.importActual<typeof import("@/lib/ai/vertexClient")>(
    "@/lib/ai/vertexClient",
  );
  return { ...actual, generateText: vi.fn() };
});

const { POST } = await import("./route");
const { generateText } = await import("@/lib/ai/vertexClient");
const mockGen = vi.mocked(generateText);

function post(body: unknown, ip = "1.2.3.4"): Request {
  return new Request("http://localhost/api/coach", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

const VALID_INPUT = {
  totalKgCo2e: 42.5,
  periodDays: 30,
  topCategories: [{ category: "transport", kgCo2e: 28.2 }],
};

describe("POST /api/coach", () => {
  beforeEach(() => mockGen.mockReset());

  it("returns a validated coach report", async () => {
    mockGen.mockResolvedValue(
      JSON.stringify({
        summary: "About 42.5 kg CO2e over 30 days, led by transport.",
        encouragement: "Nice consistency. Keep logging.",
        tips: ["Take the train for one commute this week."],
      }),
    );

    const res = await POST(post(VALID_INPUT, "10.1.0.1"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.tips).toHaveLength(1);
    expect(typeof json.summary).toBe("string");
  });

  it("rejects an invalid body with 400 before calling the model", async () => {
    const res = await POST(post({ totalKgCo2e: -5 }, "10.1.0.2"));
    expect(res.status).toBe(400);
    expect(mockGen).not.toHaveBeenCalled();
  });

  it("maps unusable model output to a 422 with a user-safe message", async () => {
    mockGen.mockResolvedValue("Here are some thoughts about your footprint…");

    const res = await POST(post(VALID_INPUT, "10.1.0.3"));
    expect(res.status).toBe(422);
    const json = await res.json();
    // Friendly message only — never internal reasons like "schema" or "JSON".
    expect(json.error).toMatch(/try again/i);
    expect(json.error).not.toMatch(/json|schema|zod/i);
  });

  it("refuses an oversized body with 413 without parsing it", async () => {
    const res = await POST(
      new Request("http://localhost/api/coach", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "content-length": String(50 * 1024 * 1024),
          "x-forwarded-for": "10.1.0.4",
        },
        body: JSON.stringify(VALID_INPUT),
      }),
    );
    expect(res.status).toBe(413);
    expect(mockGen).not.toHaveBeenCalled();
  });
});

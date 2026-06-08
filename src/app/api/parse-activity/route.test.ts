import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock only the network layer (generateText). The route + the real parser run
// for real, so this is a genuine integration test of validation, the
// retry/guardrail path, and response shaping — without hitting Vertex AI.
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
  return new Request("http://localhost/api/parse-activity", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

describe("POST /api/parse-activity", () => {
  beforeEach(() => mockGen.mockReset());

  it("returns the parsed activity with server-computed emissions", async () => {
    mockGen.mockResolvedValue(
      JSON.stringify({
        category: "transport",
        description: "drove 10 km",
        confidence: "high",
        activity: { category: "transport", mode: "car_petrol", distanceKm: 10 },
      }),
    );

    const res = await POST(post({ text: "drove 10 km" }, "10.0.0.1"));
    expect(res.status).toBe(200);
    const json = await res.json();
    // 0.192 kg/km * 10 km = 1.92, computed server-side from the activity.
    expect(json.emissionsKgCo2e).toBeCloseTo(1.92, 5);
    expect(json.description).toBe("drove 10 km");
  });

  it("rejects an invalid body with 400 before calling the model", async () => {
    const res = await POST(post({ notText: 1 }, "10.0.0.2"));
    expect(res.status).toBe(400);
    expect(mockGen).not.toHaveBeenCalled();
  });

  it("maps unparseable model output to a 422 with a user-safe message", async () => {
    // Never valid JSON → the real parser exhausts its retry and throws an
    // ActivityParseError, which the route maps to a clean 422.
    mockGen.mockResolvedValue("I cannot help with that.");

    const res = await POST(post({ text: "???" }, "10.0.0.3"));
    expect(res.status).toBe(422);
    const json = await res.json();
    expect(typeof json.error).toBe("string");
    expect(json.error).toMatch(/describing one activity/i);
    // Confirms the self-correcting retry fired (two model calls).
    expect(mockGen).toHaveBeenCalledTimes(2);
  });
});

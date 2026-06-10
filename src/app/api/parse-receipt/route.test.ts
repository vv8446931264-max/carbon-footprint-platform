import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock only the network layer (generateFromImage). The route, the signature
// check, and the real receipt parser run for real — a genuine integration
// test of the most security-loaded endpoint.
vi.mock("@/lib/ai/vertexClient", async () => {
  const actual = await vi.importActual<typeof import("@/lib/ai/vertexClient")>(
    "@/lib/ai/vertexClient",
  );
  return { ...actual, generateFromImage: vi.fn() };
});

const { POST } = await import("./route");
const { generateFromImage } = await import("@/lib/ai/vertexClient");
const mockVision = vi.mocked(generateFromImage);

// A real 1×1 transparent PNG — passes the magic-byte signature check.
const TINY_PNG =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

// Plain text dressed up as an image — must be rejected by the signature check.
const FAKE_PNG = Buffer.from("hello, definitely not an image").toString(
  "base64",
);

function post(body: unknown, ip: string): Request {
  return new Request("http://localhost/api/parse-receipt", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

describe("POST /api/parse-receipt", () => {
  beforeEach(() => mockVision.mockReset());

  it("rejects a disallowed MIME type with 400 before calling the model", async () => {
    const res = await POST(
      post({ imageBase64: TINY_PNG, mimeType: "image/gif" }, "10.2.0.1"),
    );
    expect(res.status).toBe(400);
    expect(mockVision).not.toHaveBeenCalled();
  });

  it("rejects bytes that don't match the claimed image type (magic-byte check)", async () => {
    const res = await POST(
      post({ imageBase64: FAKE_PNG, mimeType: "image/png" }, "10.2.0.2"),
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/valid image/i);
    expect(mockVision).not.toHaveBeenCalled();
  });

  it("returns schema-validated items enriched with server-computed emissions and cost", async () => {
    mockVision.mockResolvedValue(
      JSON.stringify({
        sourceLabel: "Grocery receipt",
        items: [
          {
            category: "food",
            description: "2 kg vegetables",
            confidence: "high",
            activity: { category: "food", food: "vegetables", quantityKg: 2 },
          },
          {
            // Category disagrees with the nested activity — the parser must
            // drop this item rather than trust it.
            category: "transport",
            description: "inconsistent item",
            confidence: "low",
            activity: { category: "food", food: "beef", quantityKg: 1 },
          },
        ],
      }),
    );

    const res = await POST(
      post({ imageBase64: TINY_PNG, mimeType: "image/png" }, "10.2.0.3"),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.sourceLabel).toBe("Grocery receipt");
    expect(json.items).toHaveLength(1); // inconsistent item dropped
    expect(json.items[0].emissionsKgCo2e).toBeGreaterThan(0);
    expect(typeof json.items[0].costUsd).toBe("number");
  });

  it("maps unusable vision output to a 422 with a user-safe message", async () => {
    mockVision.mockResolvedValue("I see a receipt with several items on it.");

    const res = await POST(
      post({ imageBase64: TINY_PNG, mimeType: "image/png" }, "10.2.0.4"),
    );
    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.error).not.toMatch(/json|schema|zod/i);
  });
});

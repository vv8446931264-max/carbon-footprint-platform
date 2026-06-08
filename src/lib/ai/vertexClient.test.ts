import { describe, expect, it } from "vitest";
import { extractJson } from "./vertexClient";

describe("extractJson", () => {
  it("parses a plain JSON object", () => {
    expect(extractJson('{"a": 1}')).toEqual({ a: 1 });
  });

  it("parses JSON wrapped in markdown fences", () => {
    expect(extractJson('Here you go:\n```json\n{"a": 1}\n```')).toEqual({
      a: 1,
    });
  });

  it("parses a JSON array", () => {
    expect(extractJson("[1, 2, 3]")).toEqual([1, 2, 3]);
  });

  it("ignores leading/trailing prose around the object", () => {
    expect(extractJson('Sure! {"a": 1} Hope that helps.')).toEqual({ a: 1 });
  });

  it("throws when no JSON is present", () => {
    expect(() => extractJson("no json here")).toThrow();
  });

  it("throws on malformed JSON", () => {
    expect(() => extractJson("{a: 1,}")).toThrow();
  });
});

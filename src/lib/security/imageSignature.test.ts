import { describe, expect, it } from "vitest";
import { isValidImageSignature } from "./imageSignature";

/** Build base64 from raw byte arrays for deterministic fixtures. */
function b64(bytes: number[]): string {
  return Buffer.from(bytes).toString("base64");
}

const PNG_HEADER = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0];
const JPEG_HEADER = [0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0];
const WEBP_HEADER = [
  0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
];

describe("isValidImageSignature", () => {
  it("accepts a real PNG header", () => {
    expect(isValidImageSignature(b64(PNG_HEADER), "image/png")).toBe(true);
  });

  it("accepts a real JPEG header", () => {
    expect(isValidImageSignature(b64(JPEG_HEADER), "image/jpeg")).toBe(true);
  });

  it("accepts a real WebP header", () => {
    expect(isValidImageSignature(b64(WEBP_HEADER), "image/webp")).toBe(true);
  });

  it("rejects arbitrary text masquerading as an image", () => {
    const garbage = Buffer.from("this is not an image at all").toString(
      "base64",
    );
    expect(isValidImageSignature(garbage, "image/png")).toBe(false);
    expect(isValidImageSignature(garbage, "image/jpeg")).toBe(false);
  });

  it("rejects a PNG payload claiming to be a JPEG (mismatched type)", () => {
    expect(isValidImageSignature(b64(PNG_HEADER), "image/jpeg")).toBe(false);
  });

  it("rejects an unsupported mime type", () => {
    expect(isValidImageSignature(b64(PNG_HEADER), "image/gif")).toBe(false);
  });

  it("rejects RIFF data that is not WEBP", () => {
    const riffWav = [
      0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x41, 0x56, 0x45,
    ];
    expect(isValidImageSignature(b64(riffWav), "image/webp")).toBe(false);
  });
});

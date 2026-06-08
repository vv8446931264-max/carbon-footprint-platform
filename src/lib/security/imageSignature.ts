/**
 * Verifies that base64 image data actually *starts with the magic bytes* of the
 * MIME type the client claims. Without this, a caller could send 8 MB of
 * arbitrary text with `mimeType: "image/png"` and we'd forward it (and pay) to
 * the Vertex AI vision model. Cheap to check — we only decode the first few
 * bytes — and a meaningful guardrail on an AI-cost-bearing endpoint.
 */

// File signatures (magic numbers) for the formats we accept.
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG = [0xff, 0xd8, 0xff];
const RIFF = [0x52, 0x49, 0x46, 0x46]; // "RIFF"
const WEBP = [0x57, 0x45, 0x42, 0x50]; // "WEBP" (at byte offset 8)

function startsWith(bytes: Uint8Array, signature: number[]): boolean {
  if (bytes.length < signature.length) return false;
  return signature.every((byte, i) => bytes[i] === byte);
}

export function isValidImageSignature(
  base64: string,
  mimeType: string,
): boolean {
  let header: Buffer;
  try {
    // 24 base64 chars decode to ~18 bytes — enough for every signature below.
    header = Buffer.from(base64.slice(0, 24), "base64");
  } catch {
    return false;
  }
  if (header.length < 3) return false;

  switch (mimeType) {
    case "image/png":
      return startsWith(header, PNG);
    case "image/jpeg":
      return startsWith(header, JPEG);
    case "image/webp":
      return (
        startsWith(header, RIFF) &&
        header.length >= 12 &&
        WEBP.every((byte, i) => header[8 + i] === byte)
      );
    default:
      return false;
  }
}

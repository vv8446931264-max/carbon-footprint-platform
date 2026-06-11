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

/**
 * Detects the actual image MIME type from magic bytes in the base64 data,
 * ignoring whatever MIME type the client claimed. Returns null if the bytes
 * don't match any accepted image format — meaning it's not a real image.
 *
 * Prefer this over `isValidImageSignature` so mis-labelled files (e.g. a WebP
 * downloaded and saved as .jpg) still work: we detect "image/webp" and pass
 * that to the vision model instead of rejecting the upload.
 */
export function detectImageMimeType(
  base64: string,
): "image/jpeg" | "image/png" | "image/webp" | null {
  let header: Buffer;
  try {
    // 24 base64 chars decode to ~18 bytes — enough for every signature below.
    header = Buffer.from(base64.slice(0, 24), "base64");
  } catch {
    return null;
  }
  if (header.length < 3) return null;

  if (startsWith(header, JPEG)) return "image/jpeg";
  if (startsWith(header, PNG)) return "image/png";
  if (
    startsWith(header, RIFF) &&
    header.length >= 12 &&
    WEBP.every((byte, i) => header[8 + i] === byte)
  )
    return "image/webp";
  return null;
}

export function isValidImageSignature(
  base64: string,
  mimeType: string,
): boolean {
  return detectImageMimeType(base64) === mimeType;
}

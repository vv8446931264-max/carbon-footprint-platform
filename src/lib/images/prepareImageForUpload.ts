/**
 * Client-side image preparation for the receipt upload.
 *
 * Phone photos are routinely 4000+ px and 3–6 MB. The vision model reads a
 * receipt perfectly well at ~1600 px, so uploading the original wastes
 * bandwidth (base64 adds +33% on top), slows the request down, and spends
 * more vision tokens than needed. Downscaling in the browser before upload
 * typically turns a 4 MB photo into a ~200–400 KB JPEG — a 10–20× saving —
 * with no visible loss for OCR-style reading.
 *
 * Fails safe: if anything in the canvas pipeline throws (exotic format,
 * memory pressure), we fall back to uploading the original file unchanged.
 */

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.85;
/** Files already smaller than this are sent as-is — re-encoding tiny images can grow them. */
const SKIP_BELOW_BYTES = 400 * 1024;

export interface PreparedImage {
  /** Raw base64 (no `data:...;base64,` prefix). */
  base64: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
}

export async function prepareImageForUpload(file: File): Promise<PreparedImage> {
  const originalMime = file.type as PreparedImage["mimeType"];

  if (file.size <= SKIP_BELOW_BYTES) {
    return { base64: await fileToBase64(file), mimeType: originalMime };
  }

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(
      1,
      MAX_DIMENSION / Math.max(bitmap.width, bitmap.height),
    );

    // Always draw through canvas even when scale === 1. Normalising to JPEG
    // here ensures the bytes always match the "image/jpeg" MIME type we
    // declare — a file saved as .jpg that is actually WebP (common from
    // browser downloads) would otherwise pass the client MIME check but fail
    // the server-side magic-byte signature verification.
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);

    const context = canvas.getContext("2d");
    if (!context) throw new Error("2D canvas context unavailable.");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const blob = await canvasToBlob(canvas, "image/jpeg", JPEG_QUALITY);
    return { base64: await fileToBase64(blob), mimeType: "image/jpeg" };
  } catch {
    // Fail safe: send the original rather than blocking the user.
    return { base64: await fileToBase64(file), mimeType: originalMime };
  }
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Canvas export failed.")),
      type,
      quality,
    );
  });
}

function fileToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Unexpected file read result."));
        return;
      }
      // Strip the "data:<mime>;base64," prefix — the API wants raw base64.
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.readAsDataURL(blob);
  });
}

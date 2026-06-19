import { GoogleGenAI } from "@google/genai";
import { createTtlCache } from "./cache";

/**
 * Lazily-constructed singleton so the client is created at most once
 * and only when an AI feature is actually invoked (keeps cold starts fast
 * and avoids requiring GCP credentials for routes that don't need them).
 */
let cachedClient: GoogleGenAI | null = null;

function getProjectConfig() {
  const project = process.env.GCP_PROJECT_ID;
  const location = process.env.GCP_LOCATION ?? "us-central1";

  if (!project) {
    throw new Error(
      "GCP_PROJECT_ID environment variable is not set. Configure it in .env.local (see .env.example).",
    );
  }

  return { project, location };
}

function getClient(): GoogleGenAI {
  if (cachedClient) return cachedClient;

  const { project, location } = getProjectConfig();
  cachedClient = new GoogleGenAI({ vertexai: true, project, location });
  return cachedClient;
}

const MODEL_NAME = process.env.GCP_GEMINI_MODEL ?? "gemini-2.5-flash";

/**
 * Hard ceilings on how long we'll wait for the model. Without these, a hung
 * upstream call pins the request (and a Cloud Run instance) until the
 * platform's own timeout — with them, the user gets a clean, retryable
 * error in seconds. Vision calls get longer because image tokens are slower.
 */
const TEXT_TIMEOUT_MS = 30_000;
const VISION_TIMEOUT_MS = 45_000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${ms / 1000}s.`)),
      ms,
    );
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/**
 * Memoizes identical text prompts so we never pay Vertex AI latency/credits
 * twice for the same input (e.g. a user re-logging an identical activity).
 * 30-minute TTL, capped at 500 entries with LRU eviction.
 */
const responseCache = createTtlCache<string>({
  maxEntries: 500,
  ttlMs: 30 * 60 * 1000,
});

/**
 * In-flight request coalescing: the response cache only stores *completed*
 * results, so N concurrent identical prompts used to fan out as N paid
 * Vertex calls (classic cache stampede). Sharing the pending promise means
 * concurrent duplicates cost one call.
 */
const inFlight = new Map<string, Promise<string>>();

/**
 * Sends a text prompt to Gemini via Vertex AI and returns the raw text
 * response. Results are cached by (model + system + prompt); pass
 * `{ cache: false }` to force a fresh call (e.g. self-correcting retries,
 * where the prompt already differs anyway).
 */
export async function generateText(
  prompt: string,
  systemInstruction?: string,
  options: { cache?: boolean; temperature?: number } = {},
): Promise<string> {
  const useCache = options.cache !== false;
  // Normalise the *key* (not the prompt we send) so trivially-different inputs
  // — "Drove 10 km", "drove 10 km", "drove  10 km" — share a cache entry
  // instead of each paying for a fresh Vertex AI call.
  const cacheKey = [
    MODEL_NAME,
    systemInstruction ?? "",
    normalizeForKey(prompt),
  ].join(" ");

  if (useCache) {
    const hit = responseCache.get(cacheKey);
    if (hit !== undefined) return hit;

    const pending = inFlight.get(cacheKey);
    if (pending !== undefined) return pending;
  }

  const request = (async () => {
    const client = getClient();

    const response = await withTimeout(
      client.models.generateContent({
        model: MODEL_NAME,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          temperature: options.temperature ?? 0.2,
          maxOutputTokens: 1024,
          ...(systemInstruction
            ? {
                systemInstruction: {
                  role: "system",
                  parts: [{ text: systemInstruction }],
                },
              }
            : {}),
        },
      }),
      TEXT_TIMEOUT_MS,
      "Vertex AI text generation",
    );

    const text = response.text;
    if (!text) {
      throw new Error("Vertex AI returned an empty response.");
    }

    if (useCache) responseCache.set(cacheKey, text);
    return text;
  })();

  if (useCache) {
    inFlight.set(cacheKey, request);
    request.finally(() => inFlight.delete(cacheKey)).catch(() => {});
  }

  return request;
}

/** Lower-cases and collapses whitespace so equivalent prompts share a cache key. */
function normalizeForKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Multimodal call: sends an image (base64, no data-URL prefix) plus a text
 * prompt to Gemini. Powers the bill/receipt interpreter. Not cached — image
 * payloads make poor cache keys and are rarely re-submitted identically.
 */
export async function generateFromImage(
  imageBase64: string,
  mimeType: string,
  prompt: string,
  systemInstruction?: string,
): Promise<string> {
  const client = getClient();

  const response = await withTimeout(
    client.models.generateContent({
      model: MODEL_NAME,
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType, data: imageBase64 } },
            { text: prompt },
          ],
        },
      ],
      config: {
        temperature: 0.1,
        maxOutputTokens: 2048,
        ...(systemInstruction
          ? {
              systemInstruction: {
                role: "system",
                parts: [{ text: systemInstruction }],
              },
            }
          : {}),
      },
    }),
    VISION_TIMEOUT_MS,
    "Vertex AI vision call",
  );

  const text = response.text;
  if (!text) {
    throw new Error("Vertex AI returned an empty response for the image.");
  }

  return text;
}

/**
 * Extracts the first valid JSON object/array from a model response.
 * Models occasionally wrap JSON in markdown fences or prose — this
 * guards against that without trusting the output blindly.
 */
export function extractJson(rawText: string): unknown {
  const fencedMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch ? fencedMatch[1] : rawText;

  const start = Math.min(
    ...["{", "["].map((token) => {
      const index = candidate.indexOf(token);
      return index === -1 ? Number.POSITIVE_INFINITY : index;
    }),
  );

  if (!Number.isFinite(start)) {
    throw new Error("No JSON object or array found in AI response.");
  }

  const closingToken = candidate[start] === "{" ? "}" : "]";
  const end = candidate.lastIndexOf(closingToken);
  if (end === -1 || end < start) {
    throw new Error("Malformed JSON in AI response.");
  }

  return JSON.parse(candidate.slice(start, end + 1));
}

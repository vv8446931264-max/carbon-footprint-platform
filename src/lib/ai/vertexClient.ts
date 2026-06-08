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
 * Memoizes identical text prompts so we never pay Vertex AI latency/credits
 * twice for the same input (e.g. a user re-logging an identical activity).
 * 30-minute TTL, capped at 500 entries with LRU eviction.
 */
const responseCache = createTtlCache<string>({
  maxEntries: 500,
  ttlMs: 30 * 60 * 1000,
});

/**
 * Sends a text prompt to Gemini via Vertex AI and returns the raw text
 * response. Results are cached by (model + system + prompt); pass
 * `{ cache: false }` to force a fresh call (e.g. self-correcting retries,
 * where the prompt already differs anyway).
 */
export async function generateText(
  prompt: string,
  systemInstruction?: string,
  options: { cache?: boolean } = {},
): Promise<string> {
  const useCache = options.cache !== false;
  const cacheKey = `${MODEL_NAME} ${systemInstruction ?? ""} ${prompt}`;

  if (useCache) {
    const hit = responseCache.get(cacheKey);
    if (hit !== undefined) return hit;
  }

  const client = getClient();

  const response = await client.models.generateContent({
    model: MODEL_NAME,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      temperature: 0.2,
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
  });

  const text = response.text;
  if (!text) {
    throw new Error("Vertex AI returned an empty response.");
  }

  if (useCache) responseCache.set(cacheKey, text);
  return text;
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

  const response = await client.models.generateContent({
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
  });

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

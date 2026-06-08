import { GoogleGenAI } from "@google/genai";

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

const MODEL_NAME = process.env.GCP_GEMINI_MODEL ?? "gemini-2.0-flash-001";

/**
 * Sends a prompt to Gemini via Vertex AI and returns the raw text response.
 * Centralizing this call makes it easy to add caching, retries, or logging
 * in one place rather than scattering `generateContent` calls across routes.
 */
export async function generateText(prompt: string, systemInstruction?: string): Promise<string> {
  const client = getClient();

  const response = await client.models.generateContent({
    model: MODEL_NAME,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      temperature: 0.2,
      maxOutputTokens: 1024,
      ...(systemInstruction
        ? { systemInstruction: { role: "system", parts: [{ text: systemInstruction }] } }
        : {}),
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Vertex AI returned an empty response.");
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

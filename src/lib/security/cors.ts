/**
 * Explicit CORS policy for Carbon Coach API routes.
 *
 * Current stance: same-origin only (no CORS headers returned).
 * This prevents external sites from calling our API and consuming
 * Vertex AI quota. It is intentional, not accidental.
 *
 * If cross-origin access is ever needed (mobile app, partner integration):
 *   1. Add allowed origins to ALLOWED_ORIGINS env var (comma-separated).
 *   2. Never use a wildcard — only explicit origins.
 *   3. Document the reason and date in a comment here.
 */
export function corsHeaders(origin: string | null): HeadersInit {
  const allowed = (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  if (!origin || !allowed.includes(origin)) {
    return {}; // same-origin only — no CORS headers
  }

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

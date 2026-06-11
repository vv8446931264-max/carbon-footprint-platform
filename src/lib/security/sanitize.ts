/**
 * Strips HTML/script tags from AI-generated text before storage or rendering.
 * Zod validates structure; this validates content safety.
 *
 * We don't add isomorphic-dompurify as a dependency because these fields are
 * plain text — no HTML is ever intentional. A tag-stripping regex is the right
 * tool: smaller, faster, zero dependency, and impossible to misconfigure.
 */
export function sanitizeText(value: string): string {
  return value
    .replace(/<[^>]*>/g, "") // strip any HTML/XML tags
    .replace(/javascript:/gi, "") // strip JS protocol (href, src injection)
    .trim();
}

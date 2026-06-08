import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/**
 * Content Security Policy.
 *
 * We use the config-based (non-nonce) CSP so the home page can stay statically
 * rendered/CDN-cacheable on Cloud Run. The tradeoff is `'unsafe-inline'` for
 * scripts/styles, which Next.js' inline bootstrap and Tailwind's inline styles
 * require without a per-request nonce. For a stricter posture you'd move to a
 * nonce-based CSP in `proxy.ts` (Next 16's renamed middleware), accepting
 * forced dynamic rendering — see ARCHITECTURE.md "Security" for the rationale.
 * `'unsafe-eval'` and the websocket connection are dev-only (React refresh/HMR).
 */
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' blob: data:",
  "font-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  `connect-src 'self'${isDev ? " ws:" : ""}`,
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "off" },
];

const nextConfig: NextConfig = {
  // Produces a minimal standalone server bundle — keeps the container
  // image small and startup fast on Cloud Run.
  output: "standalone",

  // Apply hardening headers to every route. Defence-in-depth alongside the
  // per-route Zod validation, rate limiting, and AI-output schema guardrails.
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;

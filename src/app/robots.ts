import type { MetadataRoute } from "next";

const SITE_URL =
  "https://carbon-footprint-platform-1053195634368.us-central1.run.app";

/**
 * Served at /robots.txt. Allows crawling of the public app and points crawlers
 * at the sitemap; the AI API routes aren't useful to index.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

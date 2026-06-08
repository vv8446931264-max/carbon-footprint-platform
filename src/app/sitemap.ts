import type { MetadataRoute } from "next";

const SITE_URL =
  "https://carbon-footprint-platform-1053195634368.us-central1.run.app";

/** Served at /sitemap.xml. A single-page app, so just the root for now. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}

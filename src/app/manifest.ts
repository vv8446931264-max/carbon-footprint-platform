import type { MetadataRoute } from "next";

/**
 * Web app manifest (served at /manifest.webmanifest), making the app
 * installable as a PWA and giving it a proper name, colors, and icon.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Carbon Coach: Understand, Track & Reduce Your Footprint",
    short_name: "Carbon Coach",
    description:
      "Understand, track, and reduce your personal carbon footprint with AI-powered insights. Private by design.",
    start_url: "/",
    display: "standalone",
    background_color: "#fbfaf8",
    theme_color: "#047857",
    categories: ["lifestyle", "education", "utilities"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produces a minimal standalone server bundle — keeps the container
  // image small and startup fast on Cloud Run.
  output: "standalone",
};

export default nextConfig;

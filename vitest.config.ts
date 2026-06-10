import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      // Requires: npm i -D @vitest/coverage-v8
      provider: "v8",
      reporter: ["text", "lcov"],
      // Measure the logic that carries correctness/security weight. UI
      // components are exercised via component + axe tests; pixel-pushing
      // wrappers are excluded so the threshold stays meaningful, not gamed.
      include: ["src/lib/**/*.ts", "src/app/api/**/*.ts"],
      exclude: ["src/**/*.test.*", "src/types/**"],
      thresholds: {
        statements: 85,
        branches: 80,
        functions: 85,
        lines: 85,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

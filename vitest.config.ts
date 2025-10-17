import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    testTimeout: 10000,

    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "dist/",
        "**/*.test.ts",
        "**/*.spec.ts",
        "**/*-types.ts",
        "**/*-schema.ts",
        "**/*-route.ts",
        "**/index.ts",
      ],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 60,
        statements: 60,
      },
    },

    setupFiles: ["./vitest.setup.ts"],

    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/packages/**",
      "**/indexes/**",
      "**/.{idea,git,cache,output,temp}/**",
    ],
  },
});

import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    testTimeout: 60000,
    hookTimeout: 60000,
    include: ["tests/anchor/**/*.test.ts"],
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});

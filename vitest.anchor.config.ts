import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    testTimeout: 180000,
    hookTimeout: 180000,
    include: ["tests/anchor/**/*.test.ts"],
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});

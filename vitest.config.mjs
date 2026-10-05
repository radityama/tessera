import { defineConfig } from "vitest/config";
export default defineConfig({
  root: process.cwd(),
  test: {
    environment: "node",
    include: [
      "tests/**/*.test.{ts,tsx,js,mjs}",
      "src/**/*.test.{ts,tsx,js,mjs}",
    ],
  },
});

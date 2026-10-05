import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";
import { importBoundaries } from "./tooling/import-boundaries.mjs";
const workspaces = {
  "packages/shared": [],
  "packages/registry": ["shared"],
  "packages/adapters": ["registry", "shared"],
  "packages/core": ["registry", "shared"],
  "packages/cli": ["core", "shared"],
  "packages/mcp": ["core", "shared"],
  "apps/web": ["core", "shared"],
  "apps/docs": [],
};
const allExports = Object.keys(workspaces).map(
  (path) => `@tessera/${path.split("/").at(-1)}`,
);
const plugin = { rules: { "import-boundaries": importBoundaries } };
const boundaries = Object.entries(workspaces).flatMap(([path, allowed]) => [
  {
    files: [`${path}/**/*.{js,mjs,ts,tsx}`],
    plugins: { tessera: plugin },
    rules: {
      "tessera/import-boundaries": [
        "error",
        allowed.map((name) => `@tessera/${name}`),
      ],
    },
  },
  {
    files: [
      `${path}/**/*.test.{js,mjs,ts,tsx}`,
      `${path}/tests/**/*.{js,mjs,ts,tsx}`,
    ],
    rules: { "tessera/import-boundaries": ["error", allExports] },
  },
]);
export default defineConfig(
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.turbo/**",
      "**/.next/**",
      "**/coverage/**",
      ".superpowers/**",
    ],
  },
  {
    files: ["**/*.{js,mjs,ts,tsx}"],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: { globals: globals.node },
  },
  ...boundaries,
);

import js from "@eslint/js";
import tseslint from "typescript-eslint";

/**
 * Node globals for the plain JavaScript in this repo — build scripts, the
 * packaging smoke test, and this config file itself. TypeScript files get these
 * from typescript-eslint's overrides; `.mjs` and `.js` files do not.
 */
const nodeGlobals = {
  console: "readonly",
  process: "readonly",
  Buffer: "readonly",
  URL: "readonly",
  TextDecoder: "readonly",
  Response: "readonly",
  AbortController: "readonly",
  fetch: "readonly",
  setTimeout: "readonly",
  clearTimeout: "readonly",
  __dirname: "readonly",
  __filename: "readonly",
  globalThis: "readonly",
};

export default tseslint.config(
  // Global ignores must live in their own object; adding any other key turns
  // them into scoped ignores and stops them applying repo-wide.
  {
    ignores: [
      "**/dist/**",
      "**/coverage/**",
      "**/.next/**",
      "**/node_modules/**",
      "**/bundled-registry/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.js", "**/*.mjs"],
    languageOptions: { globals: nodeGlobals },
  },
  {
    rules: {
      // A leading underscore marks a binding that exists only to be omitted
      // (e.g. `const { field: _drop, ...rest } = record`).
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
    },
  },
);

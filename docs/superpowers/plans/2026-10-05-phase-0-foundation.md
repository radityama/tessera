# Tessera Phase 0 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every workspace buildable and establish reproducible checks without implementing later product phases.

**Architecture:** Root configuration controls strict ESM builds, linting, formatting, and tests. Workspace packages retain the dependency direction in the approved spec; a local ESLint rule checks imports. Applications remain empty buildable modules until their assigned phases.

**Tech Stack:** Node.js 24+, pnpm 10.34.6, Turborepo 2.11.7, TypeScript 5.9.3, ESLint 9.39.5, typescript-eslint 8.71.0, Prettier 3.9.9, Vitest 4.1.11.

---

## Spec

`docs/superpowers/specs/2026-10-05-phase-0-foundation-design.md`, approved in conversation on 2026-10-05.

## Global Constraints

- This specification covers Phase 0 of `TASKS.md`. Phases 1 through 9 remain required and retain their documented order.
- Production imports follow the direction in `docs/architecture.md`.
- Use package exports for public interfaces rather than relative imports into another package's source directory.
- Test files may import interfaces needed for the cross-interface contract tests required by later phases; this exception does not apply to production code.
- Library builds emit ESM JavaScript and TypeScript declarations into `dist`.
- Do not add dummy assertions to make the test command green.
- No test requires a live third-party website.
- Install, formatting, lint, typecheck, test, and build failures return nonzero exit codes and block advancement.
- Do not choose a distribution license implicitly or publish packages during Phase 0.

## File responsibilities

| Files | Responsibility |
| --- | --- |
| `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml` | Tool versions, scripts, workspace membership, reproducible dependencies |
| `tsconfig.base.json`, workspace `tsconfig.json` files | Strict ESM builds and declarations |
| `turbo.json` | Dependency ordering and cache invalidation |
| `eslint.config.mjs`, `tooling/import-boundaries.mjs` | Lint defaults and package import policy |
| `prettier.config.mjs`, `.prettierignore` | Formatting policy |
| `vitest.config.mjs`, `tests/import-boundaries.test.mjs` | Node tests and meaningful boundary verification |
| Eight workspace manifests and `src/index.ts` files | Empty public modules and executable development/check scripts |
| `.github/workflows/ci.yml` | Fresh-checkout installation and checks |
| `README.md`, `CONTRIBUTING.md`, `docs/testing.md`, eight workspace READMEs | Setup, tooling status, and verification guidance |

## Task 1: Buildable workspaces and tested architecture checks

**Files:** Modify `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, `turbo.json`, `.gitignore`, and the approved spec's status. Create `eslint.config.mjs`, `tooling/import-boundaries.mjs`, `prettier.config.mjs`, `.prettierignore`, `vitest.config.mjs`, `tests/import-boundaries.test.mjs`, and `pnpm-lock.yaml`. Create `package.json`, `tsconfig.json`, and `src/index.ts` in each of `packages/shared`, `packages/registry`, `packages/adapters`, `packages/core`, `packages/cli`, `packages/mcp`, `apps/web`, and `apps/docs`.

- [ ] Step 1: Record the spec as approved and configure the root manifest.

Set the spec status to `Status: written specification approved in conversation on 2026-10-05.` Use this root manifest:

```json
{
  "name": "tessera",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "packageManager": "pnpm@10.34.6",
  "engines": { "node": ">=24" },
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "eslint . --max-warnings 0 && turbo run lint",
    "typecheck": "turbo run typecheck",
    "test": "vitest run && turbo run test",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  },
  "devDependencies": {
    "@eslint/js": "9.39.5",
    "@types/node": "24.19.1",
    "eslint": "9.39.5",
    "globals": "17.13.0",
    "prettier": "3.9.9",
    "turbo": "2.11.7",
    "typescript": "5.9.3",
    "typescript-eslint": "8.71.0",
    "vitest": "4.1.11"
  }
}
```

Set `pnpm-workspace.yaml`:

```yaml
packages:
  - apps/*
  - packages/*
onlyBuiltDependencies:
  - esbuild
```

Append `.superpowers/` to `.gitignore` for execution reports. Do not stage execution reports.

- [ ] Step 2: Configure TypeScript, workspace manifests, and empty modules.

Use this `tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "sourceMap": true,
    "types": ["node"]
  }
}
```

The following transient Node.js script defines the exact contents for all eight workspaces; it may be executed without saving a generator to the repository:

```js
import { mkdir, writeFile } from "node:fs/promises";
const workspaces = [
  ["packages/shared", "shared"],
  ["packages/registry", "registry"],
  ["packages/adapters", "adapters"],
  ["packages/core", "core"],
  ["packages/cli", "cli"],
  ["packages/mcp", "mcp"],
  ["apps/web", "web"],
  ["apps/docs", "docs"],
];
for (const [directory, name] of workspaces) {
  await mkdir(`${directory}/src`, { recursive: true });
  const manifest = {
    name: `@tessera/${name}`,
    private: true,
    version: "0.0.0",
    type: "module",
    engines: { node: ">=24" },
    exports: { ".": { types: "./dist/index.d.ts", import: "./dist/index.js" } },
    files: ["dist"],
    scripts: {
      build: "tsc -p tsconfig.json",
      dev: "tsc -p tsconfig.json --watch --preserveWatchOutput",
      lint: "eslint src --max-warnings 0",
      typecheck: "tsc -p tsconfig.json --noEmit",
      test: "vitest run --config ../../vitest.config.mjs --passWithNoTests",
    },
  };
  const config = {
    extends: "../../tsconfig.base.json",
    compilerOptions: { rootDir: "src", outDir: "dist" },
    include: ["src/**/*.ts"],
    exclude: ["dist", "node_modules"],
  };
  await writeFile(`${directory}/package.json`, `${JSON.stringify(manifest, null, 2)}\n`);
  await writeFile(`${directory}/tsconfig.json`, `${JSON.stringify(config, null, 2)}\n`);
  await writeFile(`${directory}/src/index.ts`, "export {};\n");
}
```

No internal dependencies are needed for empty modules. Add `workspace:*` dependencies only when later implementations actually import them.

- [ ] Step 3: Configure Turbo and formatting.

Use this `turbo.json`:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["tsconfig.base.json", "eslint.config.mjs", "tooling/**", "vitest.config.mjs", "prettier.config.mjs", "pnpm-lock.yaml"],
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**", ".next/**", "!.next/cache/**"] },
    "dev": { "cache": false, "persistent": true },
    "lint": {},
    "typecheck": { "dependsOn": ["^build"] },
    "test": { "dependsOn": ["^build"], "outputs": ["coverage/**"] }
  }
}
```

Use this `prettier.config.mjs`:

```js
export default { semi: true, singleQuote: false, trailingComma: "all", proseWrap: "preserve" };
```

Use this `.prettierignore`:

```text
node_modules/
.pnpm-store/
.turbo/
.superpowers/
**/dist/
**/coverage/
**/.next/
pnpm-lock.yaml
FILE_STRUCTURE.txt
```

- [ ] Step 4: Add the boundary tests before implementing the rule.

Use this `vitest.config.mjs`:

```js
import { defineConfig } from "vitest/config";
export default defineConfig({
  root: process.cwd(),
  test: { environment: "node", include: ["tests/**/*.test.{ts,tsx,js,mjs}", "src/**/*.test.{ts,tsx,js,mjs}"] },
});
```

Create `tests/import-boundaries.test.mjs`:

```js
import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";
const eslint = new ESLint();
const cases = [
  ["core can consume registry", "packages/core/src/index.ts", 'import "@tessera/registry";', 0],
  ["adapters can consume registry", "packages/adapters/src/index.ts", 'import "@tessera/registry";', 0],
  ["shared cannot consume registry", "packages/shared/src/index.ts", 'import "@tessera/registry";', 1],
  ["core cannot consume adapters", "packages/core/src/index.ts", 'import "@tessera/adapters";', 1],
  ["core cannot consume CLI", "packages/core/src/index.ts", 'import "@tessera/cli";', 1],
  ["private package paths are rejected", "packages/core/src/index.ts", 'import "@tessera/registry/src/index.js";', 1],
  ["relative package escapes are rejected", "packages/core/src/index.ts", 'import "../../registry/src/index.js";', 1],
  ["dynamic imports obey boundaries", "packages/core/src/index.ts", 'await import("@tessera/cli");', 1],
  ["require obeys boundaries", "packages/core/src/index.ts", 'require("@tessera/cli");', 1],
  ["file URLs cannot bypass exports", "packages/core/src/index.ts", 'import "file:///tmp/registry/index.js";', 1],
  ["local relative imports remain allowed", "packages/core/src/index.ts", 'import "./utils.js";', 0],
  ["contract tests can consume CLI exports", "packages/core/src/contract.test.ts", 'import "@tessera/cli";', 0],
  ["contract tests still cannot bypass exports", "packages/core/src/contract.test.ts", 'import "../../cli/src/index.js";', 1],
];
describe("workspace import boundaries", () => {
  it.each(cases)("%s", async (_name, filePath, code, expectedErrors) => {
    const [result] = await eslint.lintText(code, { filePath });
    expect(result.fatalErrorCount).toBe(0);
    expect(result.messages).toHaveLength(expectedErrors);
    for (const message of result.messages) {
      expect(message.ruleId).toBe("tessera/import-boundaries");
    }
  });
});
```

Install with `pnpm install`. Run `pnpm exec vitest run`. Expected: the forbidden-import cases fail until the rule is configured; permissive cases should not require actual imported packages to exist.

- [ ] Step 5: Implement the import policy and flat lint configuration.

Create `tooling/import-boundaries.mjs`:

```js
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
export const importBoundaries = {
  meta: {
    type: "problem",
    schema: [{ type: "array", items: { type: "string" }, uniqueItems: true }],
    messages: { forbidden: "Import '{{specifier}}' violates workspace boundaries. Use an allowed package's public export." },
  },
  create(context) {
    const filename = context.filename;
    const root = resolve(import.meta.dirname, "..");
    const workspace = relative(root, filename).split(sep).slice(0, 2).join(sep);
    const workspaceRoot = resolve(root, workspace);
    const allowed = new Set(context.options[0]);
    function check(source) {
      const specifier = source?.value;
      if (typeof specifier !== "string") return;
      let forbidden = false;
      if (specifier.startsWith("@tessera/")) {
        forbidden = !allowed.has(specifier);
      } else if (specifier.startsWith("file:")) {
        forbidden = true;
      } else if (specifier.startsWith(".") || isAbsolute(specifier)) {
        const target = resolve(dirname(filename), specifier);
        const within = relative(workspaceRoot, target);
        forbidden = within === ".." || within.startsWith(`..${sep}`) || isAbsolute(within);
      }
      if (forbidden) context.report({ node: source, messageId: "forbidden", data: { specifier } });
    }
    return {
      ImportDeclaration(node) { check(node.source); },
      ExportNamedDeclaration(node) { check(node.source); },
      ExportAllDeclaration(node) { check(node.source); },
      ImportExpression(node) { check(node.source); },
      CallExpression(node) {
        if (node.callee.type === "Identifier" && node.callee.name === "require") check(node.arguments[0]);
      },
    };
  },
};
```

Create `eslint.config.mjs`:

```js
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
const allExports = Object.keys(workspaces).map((path) => `@tessera/${path.split("/").at(-1)}`);
const plugin = { rules: { "import-boundaries": importBoundaries } };
const boundaries = Object.entries(workspaces).flatMap(([path, allowed]) => [
  {
    files: [`${path}/**/*.{js,mjs,ts,tsx}`],
    plugins: { tessera: plugin },
    rules: { "tessera/import-boundaries": ["error", allowed.map((name) => `@tessera/${name}`)] },
  },
  {
    files: [`${path}/**/*.test.{js,mjs,ts,tsx}`, `${path}/tests/**/*.{js,mjs,ts,tsx}`],
    rules: { "tessera/import-boundaries": ["error", allExports] },
  },
]);
export default defineConfig(
  { ignores: ["**/node_modules/**", "**/dist/**", "**/.turbo/**", "**/.next/**", "**/coverage/**", ".superpowers/**"] },
  {
    files: ["**/*.{js,mjs,ts,tsx}"],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: { globals: globals.node },
  },
  ...boundaries,
);
```

Run `pnpm exec vitest run`. Expected: all 13 import-policy cases pass. Verify that forbidden package exports, relative escapes, dynamic imports, and reexports produce boundary diagnostics.

- [ ] Step 6: Format and run the phase checks before committing.

Run in order:

```bash
pnpm format
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm install --frozen-lockfile
```

Expected: exit 0 for each; root tooling tests pass; eight unimplemented workspaces report no tests and compile normally. Do not loosen TypeScript strictness or disable architecture checks to make this pass. Inspect mechanical Markdown formatting to confirm unchanged requirements. Commit all Task 1 files with `chore: configure buildable workspace tooling` after checks pass.

## Task 2: CI, documentation, and clean-build acceptance

**Files:** Create `.github/workflows/ci.yml`. Modify `README.md`, `CONTRIBUTING.md`, `docs/testing.md`, `packages/shared/README.md`, `packages/registry/README.md`, `packages/adapters/README.md`, `packages/core/README.md`, `packages/cli/README.md`, `packages/mcp/README.md`, `apps/web/README.md`, and `apps/docs/README.md`.

- [ ] Step 1: Add CI for the pinned runtime and package manager.

Create `.github/workflows/ci.yml`:

```yaml
name: CI
on:
  push:
  pull_request:
permissions:
  contents: read
jobs:
  checks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v5
        with:
          node-version: 24
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm format:check
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm build
```

Verify action versions and syntax against primary documentation before committing. Do not add deployment or publishing jobs.

- [ ] Step 2: Document current setup and foundation status.

Replace the scaffold-only status text in `README.md` with:

```markdown
The Phase 0 repository foundation is implemented. Product features begin with the canonical registry in Phase 1; retrieval, CLI, MCP, and application behavior are not implemented yet.

## Local development

Use Node.js 24 or newer. The repository pins pnpm 10.34.6 through `packageManager`. With Corepack available, run `corepack enable`, then `pnpm install`.

Run `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` before submitting a change. Use `pnpm format` to format maintained files and `pnpm dev` for compiler watch mode in all eight workspaces.

Library builds emit ESM JavaScript and declarations to `dist`. Applications are currently empty buildable modules; their web servers arrive in Phases 7 and 8. Product searches and installation commands are not available yet.
```

Append to `CONTRIBUTING.md`:

```markdown
## Development setup

Use Node.js 24+ and the pinned pnpm version. Run `pnpm install`; CI uses `pnpm install --frozen-lockfile`. Run `pnpm format:check` alongside the quality commands above.

Each workspace builds to `dist`, and TypeScript preserves strict optional-property and indexed-access checks. Internal dependencies use `workspace:*` when consumed. Import another package through its public export; do not reach into its source or reverse the documented dependency direction.

`pnpm dev` starts compiler watchers. Stop them with Ctrl+C. The application packages have no framework server until their assigned phases.
```

Append to `docs/testing.md`:

```markdown
## Phase 0 test infrastructure

Vitest runs in Node.js. The root suite tests lint enforcement of allowed dependencies, rejected private paths and relative escapes, dynamic imports, and contract-test exceptions.

Unimplemented workspaces explicitly permit no test files during foundation work. This is not evidence of product behavior. Remove that allowance from each workspace as its implementation gains meaningful tests, starting with the registry in Phase 1. Root tests do not use the allowance.

Use `pnpm test` for the root suite and workspace suites. Package tests resolve the shared configuration with their own working directory as the root. CI runs all checks from a fresh checkout, and dependent typechecking and tests wait for the dependency build artifacts they consume.
```

Replace each of the six library README placeholder paragraphs with this exact common paragraph, retaining the existing package heading:

```markdown
Phase 0 provides an empty ESM module, build and declaration output in `dist`, linting, strict typechecking, a Vitest command, and compiler watch mode. The package's product behavior is not implemented yet.

Read the root `AGENTS.md`, `TASKS.md`, and the relevant architecture and product documents before implementation. Import dependencies only through permitted public exports.
```

Preserve the app READMEs' assigned-phase instructions and append:

```markdown
The Phase 0 package is an empty buildable TypeScript module. `pnpm dev` runs its compiler watcher; no application server or user-facing pages exist yet.
```

- [ ] Step 3: Run all phase exit checks, then verify clean artifacts and development.

Run the seven commands in Task 1 Step 6 after formatting the documentation. Remove only the eight known workspace `dist` directories and the repository `.turbo` cache created by this task, then run `pnpm typecheck`, `pnpm test`, and `pnpm build` from that clean build state. Expected: exit 0 with no preexisting artifacts required.

Inspect every `dist/index.d.ts` and import every `dist/index.js` using Node.js. Expected: eight successful ESM imports and eight declaration files. Check the Turbo dependency graph structurally; all typecheck/test tasks wait for dependency builds once real dependencies are declared.

Run `pnpm dev`, wait for all eight compiler watchers to report zero errors, send Ctrl+C, and verify no watcher processes remain. Do not run an indefinitely blocking watch command.

Run `git diff --check`. Commit with `ci: verify workspace foundation and document setup` only after all checks pass. Include exact verification evidence in the task report.

- [ ] Step 4: Prepare a reviewable phase PR.

After task and whole-branch review, push only the feature branch and open a draft PR against `main`. Describe the buildable foundation and verified commands, and explicitly state that package product APIs are still empty. Do not merge, publish, or claim v0.1 is releasable.

## Plan self-review

Both tasks implement the approved Phase 0 scope. Task 1 establishes builds, runtime declarations, pinning, meaningful architecture tests, and workspace commands. Task 2 adds CI, installation/contributor/test documentation, artifact verification, clean-build checks, and development smoke verification. Later feature phases remain required. Package names, import-policy options, test paths, and shared test configuration are consistent across tasks.

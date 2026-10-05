import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";
const eslint = new ESLint();
const cases = [
  [
    "core can consume registry",
    "packages/core/src/index.ts",
    'import "@tessera/registry";',
    0,
  ],
  [
    "adapters can consume registry",
    "packages/adapters/src/index.ts",
    'import "@tessera/registry";',
    0,
  ],
  [
    "shared cannot consume registry",
    "packages/shared/src/index.ts",
    'import "@tessera/registry";',
    1,
  ],
  [
    "core cannot consume adapters",
    "packages/core/src/index.ts",
    'import "@tessera/adapters";',
    1,
  ],
  [
    "core cannot consume CLI",
    "packages/core/src/index.ts",
    'import "@tessera/cli";',
    1,
  ],
  [
    "private package paths are rejected",
    "packages/core/src/index.ts",
    'import "@tessera/registry/src/index.js";',
    1,
  ],
  [
    "relative package escapes are rejected",
    "packages/core/src/index.ts",
    'import "../../registry/src/index.js";',
    1,
  ],
  [
    "dynamic imports obey boundaries",
    "packages/core/src/index.ts",
    'await import("@tessera/cli");',
    1,
  ],
  [
    "require obeys boundaries",
    "packages/core/src/index.ts",
    'require("@tessera/cli"); // eslint-disable-line @typescript-eslint/no-require-imports',
    1,
  ],
  [
    "file URLs cannot bypass exports",
    "packages/core/src/index.ts",
    'import "file:///tmp/registry/index.js";',
    1,
  ],
  [
    "local relative imports remain allowed",
    "packages/core/src/index.ts",
    'import "./utils.js";',
    0,
  ],
  [
    "contract tests can consume CLI exports",
    "packages/core/src/contract.test.ts",
    'import "@tessera/cli";',
    0,
  ],
  [
    "contract tests still cannot bypass exports",
    "packages/core/src/contract.test.ts",
    'import "../../cli/src/index.js";',
    1,
  ],
  [
    "public type imports follow allowed dependencies",
    "packages/core/src/index.ts",
    'export type Allowed = import("@tessera/registry").Allowed;',
    0,
  ],
  [
    "type imports reject forbidden packages",
    "packages/core/src/index.ts",
    'export type Forbidden = import("@tessera/cli").Forbidden;',
    1,
  ],
  [
    "type imports reject private package paths",
    "packages/core/src/index.ts",
    'export type Private = import("@tessera/registry/src/index.js").Private;',
    1,
  ],
  [
    "type imports reject relative escapes",
    "packages/core/src/index.ts",
    'export type Private = import("../../cli/src/index.js").Private;',
    1,
  ],
  [
    "local relative type imports remain allowed",
    "packages/core/src/index.ts",
    'export type Local = import("./utils.js").Local;',
    0,
  ],
  [
    "contract tests can consume public CLI types",
    "packages/core/src/contract.test.ts",
    'export type Contract = import("@tessera/cli").Contract;',
    0,
  ],
  [
    "contract type imports reject private package paths",
    "packages/core/src/contract.test.ts",
    'export type Private = import("@tessera/cli/src/index.js").Private;',
    1,
  ],
  [
    "contract type imports reject relative escapes",
    "packages/core/src/contract.test.ts",
    'export type Private = import("../../cli/src/index.js").Private;',
    1,
  ],
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

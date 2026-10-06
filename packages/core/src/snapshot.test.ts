import { describe, expect, it } from "vitest";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { discoverRegistryFiles, loadRegistryFiles } from "@tessera/registry";
import { searchRegistry } from "./search.js";

const here = dirname(fileURLToPath(import.meta.url));
const registriesDir = join(here, "..", "..", "..", "registries");
const all = loadRegistryFiles(discoverRegistryFiles(registriesDir));

const QUERIES = [
  "technical dark hero for a developer CLI, subtle motion, terminal-oriented",
  "minimal saas pricing cards",
  "animated grid background subtle",
  "developer command menu",
];

describe("golden snapshots", () => {
  for (const q of QUERIES) {
    it(`snapshot: ${q}`, () => {
      const results = searchRegistry(all, { query: q, limit: 3 }).map((r) => ({
        id: r.component.id,
        score: r.score,
        reasons: r.reasons,
      }));
      expect(results).toMatchSnapshot();
    });
  }
});

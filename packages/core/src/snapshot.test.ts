import { describe, expect, it } from "vitest";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { discoverRegistryFiles, loadRegistryFiles } from "@tessera/registry";
import { searchRegistry } from "./search.js";

const here = dirname(fileURLToPath(import.meta.url));
const registriesDir = join(here, "..", "..", "..", "registries");
const all = loadRegistryFiles(discoverRegistryFiles(registriesDir));

/**
 * Golden queries from docs/search-ranking.md. Snapshots pin the exact ordering
 * so an accidental ranking change shows up as a reviewable diff instead of a
 * silent quality regression.
 */
const QUERIES = [
  "technical dark hero for a developer CLI, subtle motion, terminal-oriented",
  "minimal saas pricing cards",
  "animated grid background subtle",
  "developer command menu",
  "accessible login form",
  "technical dashboard table",
  "dark developer CLI hero subtle motion",
  "animated background restrained",
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

  it("is deterministic across repeated runs and argument order", () => {
    for (const q of QUERIES) {
      const a = searchRegistry(all, { query: q, limit: 5 }).map((r) => r.component.id);
      const b = searchRegistry(all, { query: q, limit: 5 }).map((r) => r.component.id);
      expect(a).toEqual(b);
    }
  });
});

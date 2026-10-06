import { describe, expect, it, beforeAll } from "vitest";
import { build } from "esbuild";
import { mkdtempSync, readdirSync, readFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { searchRegistry, type RankedResult } from "@tessera-dev/core/search";
import type { TesseraComponent } from "@tessera-dev/registry";

/**
 * The explorer must rank identically to the CLI and MCP.
 *
 * These tests bundle `src/search-client.ts` exactly as the site build does, load
 * the resulting browser bundle, and compare its output to the core package the
 * CLI and MCP call. A stale or misconfigured bundle fails here rather than
 * silently shipping a website that searches differently from the tool.
 */

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..", "..", "..");

const QUERIES = [
  "dark technical terminal hero",
  "minimal saas pricing cards",
  "animated grid background subtle",
  "developer command menu",
  "accessible login form",
  "technical dashboard table",
  "",
];

function loadRegistry(): TesseraComponent[] {
  const dir = join(repoRoot, "registries");
  if (!existsSync(dir)) return [];
  const all: TesseraComponent[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const file = join(dir, entry.name, "components.json");
    if (existsSync(file)) all.push(...JSON.parse(readFileSync(file, "utf8")));
  }
  return all;
}

const components = loadRegistry();

let browserSearch: typeof searchRegistry;
let cleanup: () => void;

beforeAll(async () => {
  const dir = mkdtempSync(join(tmpdir(), "tessera-web-parity-"));
  const outfile = join(dir, "search.js");
  await build({
    entryPoints: [join(here, "search-client.ts")],
    outfile,
    bundle: true,
    format: "esm",
    platform: "browser",
    target: "es2022",
    logLevel: "silent",
  });
  const mod = (await import(pathToFileURL(outfile).href)) as {
    searchRegistry: typeof searchRegistry;
  };
  browserSearch = mod.searchRegistry;
  cleanup = () => rmSync(dir, { recursive: true, force: true });
});

describe("explorer parity with the retrieval core", () => {
  it("has a registry to compare against", () => {
    expect(components.length).toBeGreaterThan(0);
    expect(browserSearch).toBeTypeOf("function");
  });

  for (const query of QUERIES) {
    it(`ranks identically for ${query === "" ? "<no query>" : `"${query}"`}`, () => {
      const core = searchRegistry(components, { query, limit: 10 });
      const browser = browserSearch(components, { query, limit: 10 });
      expect(browser.map((r: RankedResult) => r.component.id)).toEqual(
        core.map((r) => r.component.id),
      );
      expect(browser.map((r: RankedResult) => r.score)).toEqual(core.map((r) => r.score));
      expect(browser.map((r: RankedResult) => r.reasons)).toEqual(core.map((r) => r.reasons));
    });
  }

  it("applies filters identically", () => {
    const opts = { query: "hero", source: "aceternity", limit: 5 };
    expect(browserSearch(components, opts).map((r: RankedResult) => r.component.id)).toEqual(
      searchRegistry(components, opts).map((r) => r.component.id),
    );
  });

  it("bundles only the ranking code, not artifact retrieval", () => {
    // Fetching belongs to the CLI and MCP, never to a static page. Importing the
    // package root instead of the `./search` subpath would drag it in.
    const bundlePath = join(here, "search-client.ts");
    expect(readFileSync(bundlePath, "utf8")).toContain("@tessera-dev/core/search");
  });
});

describe("explorer build inputs", () => {
  it("does not implement its own search", () => {
    const source = readFileSync(join(here, "..", "scripts", "build.mjs"), "utf8");
    // The old explorer filtered with String.includes over rendered text. If that
    // reappears, the site and the CLI have quietly become different products.
    expect(source).not.toMatch(/term\.split|\.includes\(t\)/);
    expect(source).toContain("@tessera-dev/core/search");
  });
});

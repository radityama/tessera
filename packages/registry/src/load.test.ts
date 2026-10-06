import { describe, expect, it } from "vitest";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  discoverRegistryFiles,
  findDuplicateIds,
  loadRegistryFile,
  loadRegistryFiles,
  validateRegistry,
} from "./load.js";

const here = dirname(fileURLToPath(import.meta.url));
const registriesDir = join(here, "..", "..", "..", "registries");

function validEntry(id: string) {
  const [source, slug] = id.split("/");
  return {
    schemaVersion: 1,
    id,
    source,
    slug,
    name: "X",
    category: "hero",
    secondaryCategories: [],
    frameworks: ["react"],
    compatibility: {},
    visual: {},
    dependencies: [],
    installation: { kind: "copy" as const },
    links: {},
    license: { status: "known" as const, identifier: "MIT" },
    provenance: { adapter: source },
  };
}

describe("registry loading", () => {
  it("detects duplicates", () => {
    expect(findDuplicateIds([validEntry("a/b"), validEntry("a/b")] as never)).toEqual(["a/b"]);
  });

  it("rejects duplicate ids", () => {
    expect(() => validateRegistry([validEntry("a/b"), validEntry("a/b")])).toThrow(/duplicate/i);
  });

  it("rejects empty registry", () => {
    expect(() => validateRegistry([])).toThrow(/empty/i);
  });

  it("rejects malformed entries", () => {
    expect(() => validateRegistry([{ nope: true }])).toThrow(/entry 0/i);
  });

  it("loads all curated registry files", () => {
    const files = discoverRegistryFiles(registriesDir);
    expect(files.length).toBeGreaterThanOrEqual(5);
    const all = loadRegistryFiles(files);
    expect(all.length).toBeGreaterThanOrEqual(20);
    const ids = all.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain("beautifului/terminal-hero");
  });

  it("prefixes file path in errors", () => {
    expect(() => loadRegistryFile(join(registriesDir, "does-not-exist.json"))).toThrow();
  });
});

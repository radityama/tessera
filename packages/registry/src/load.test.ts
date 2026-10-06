import { describe, expect, it } from "vitest";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  discoverRegistryFiles,
  findDuplicateIds,
  loadRegistryFile,
  loadRegistryFiles,
  parseComponent,
  validateRegistry,
  RegistryError,
} from "./load.js";

const here = dirname(fileURLToPath(import.meta.url));
const registriesDir = join(here, "..", "..", "..", "registries");

/** Synthetic record; example.com is intentional and never shipped. */
function validEntry(id: string) {
  const [source, slug] = id.split("/");
  return {
    schemaVersion: 2,
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
    retrieval: { kind: "none" as const },
    links: {},
    license: { status: "known" as const, identifier: "MIT", source: "https://example.com/L" },
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

  it("prefixes file path in errors", () => {
    const bad = join(registriesDir, "__nonexistent__", "components.json");
    expect(() => loadRegistryFile(bad)).toThrow(/cannot read/i);
  });

  it("rejects schema v1 with an actionable message instead of reinterpreting it", () => {
    let thrown: unknown;
    try {
      parseComponent({ ...validEntry("a/b"), schemaVersion: 1 });
    } catch (err) {
      thrown = err;
    }
    expect(thrown).toBeInstanceOf(RegistryError);
    expect((thrown as RegistryError).code).toBe("unsupported-schema-version");
    expect((thrown as Error).message).toMatch(/registry:sync/);
  });

  it("rejects unknown future schema versions", () => {
    expect(() => parseComponent({ ...validEntry("a/b"), schemaVersion: 99 })).toThrow(
      /unsupported schemaVersion 99/,
    );
  });

  it("loads every published registry file", () => {
    const files = discoverRegistryFiles(registriesDir);
    expect(files.length).toBeGreaterThanOrEqual(5);
    const components = loadRegistryFiles(files);
    expect(components.length).toBeGreaterThan(50);
    expect(components.every((c) => c.schemaVersion === 2)).toBe(true);
  });

  it("ships components from every supported source", () => {
    const components = loadRegistryFiles(discoverRegistryFiles(registriesDir));
    const sources = new Set(components.map((c) => c.source));
    expect([...sources].sort()).toEqual(["aceternity", "beui", "efferd", "heroui", "magicui"]);
  });

  it("gives every shipped component a retrieval path and license status", () => {
    const components = loadRegistryFiles(discoverRegistryFiles(registriesDir));
    for (const c of components) {
      expect(c.retrieval.kind, `${c.id} has no retrieval kind`).toBeTruthy();
      expect(["known", "unknown"]).toContain(c.license.status);
      if (c.license.status === "known") {
        expect(c.license.source, `${c.id} claims a license without evidence`).toBeTruthy();
      }
    }
  });
});

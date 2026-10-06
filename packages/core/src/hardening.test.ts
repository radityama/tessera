import { describe, expect, it } from "vitest";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { discoverRegistryFiles, loadRegistryFiles, validateRegistry } from "@tessera/registry";
import { buildInstallationPlan, getComponent, searchRegistry } from "./search.js";

const here = dirname(fileURLToPath(import.meta.url));
const registriesDir = join(here, "..", "..", "..", "registries");
const all = loadRegistryFiles(discoverRegistryFiles(registriesDir));

/** Synthetic record; example.com is intentional and never shipped. */
function entry(id: string, extra: Record<string, unknown> = {}) {
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
    ...extra,
  };
}

describe("hardening", () => {
  it("rejects malformed registry entries with index context", () => {
    expect(() => validateRegistry([{ nope: true }])).toThrow(/entry 0/);
  });

  it("rejects duplicate ids across combined snapshots", () => {
    expect(() => validateRegistry([entry("a/b"), entry("a/b")])).toThrow(/duplicate/i);
  });

  it("returns empty array for empty registry search (no throw)", () => {
    expect(searchRegistry([], { query: "hero" })).toEqual([]);
  });

  it("never treats unknown license as safe to vendor", () => {
    const unknown = getComponent(all, "efferd/hero-1");
    expect(unknown.license.status).toBe("unknown");
    expect(unknown.license.identifier).toBeUndefined();
    const plan = buildInstallationPlan(unknown);
    expect(plan.licenseWarning).toMatch(/verify/i);
  });

  it("flags licenses that permit use but forbid redistribution", () => {
    const aceternity = getComponent(all, "aceternity/terminal");
    expect(aceternity.license.osiApproved).toBe(false);
    expect(aceternity.license.redistribution).toBe("restricted");
    // The source may be fetched for a user, but Tessera must not vendor it.
    expect(aceternity.retrieval.kind).toBe("shadcn-registry");
  });

  it("resolves representative queries to stable results", () => {
    const command = searchRegistry(all, { query: "developer command menu", limit: 1 });
    expect(command[0]?.component.category).toBe("command-menu");

    const pricing = searchRegistry(all, { query: "minimal saas pricing cards", limit: 1 });
    expect(pricing[0]?.component.category).toBe("pricing");

    const grid = searchRegistry(all, { query: "animated grid background subtle", limit: 1 });
    expect(grid[0]?.component.category).toBe("background");
  });
});

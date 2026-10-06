import { describe, expect, it } from "vitest";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { discoverRegistryFiles, loadRegistryFiles, validateRegistry } from "@tessera/registry";
import { buildInstallationPlan, getComponent, searchRegistry } from "./search.js";

const here = dirname(fileURLToPath(import.meta.url));
const registriesDir = join(here, "..", "..", "..", "registries");
const all = loadRegistryFiles(discoverRegistryFiles(registriesDir));

function entry(id: string, extra: Record<string, unknown> = {}) {
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
    const unknown = getComponent(all, "efferd/terminal-panel");
    expect(unknown.license.status).toBe("unknown");
    expect(unknown.license.identifier).toBeUndefined();
    const plan = buildInstallationPlan(unknown);
    expect(plan.licenseWarning).toMatch(/verify/i);
  });

  it("resolves representative queries to stable top ids", () => {
    expect(
      searchRegistry(all, {
        query: "technical dark hero for a developer CLI, subtle motion, terminal-oriented",
        limit: 1,
      })[0]?.component.id,
    ).toBe("beautifului/terminal-hero");
    expect(
      searchRegistry(all, { query: "developer command menu", limit: 1 })[0]?.component.category,
    ).toBe("command-menu");
  });
});

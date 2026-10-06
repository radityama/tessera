import { describe, expect, it } from "vitest";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { discoverRegistryFiles, loadRegistryFiles } from "@tessera-dev/registry";
import { findSimilar, getComponent, searchPatterns, searchRegistry } from "./search.js";
import { inferQueryIntent } from "./query.js";
import { scoreComponent } from "./score.js";

const here = dirname(fileURLToPath(import.meta.url));
const registriesDir = join(here, "..", "..", "..", "registries");
const all = loadRegistryFiles(discoverRegistryFiles(registriesDir));

describe("core search", () => {
  it("ranks hero and terminal candidates top for the golden technical query", () => {
    const results = searchRegistry(all, {
      query: "technical dark hero for a developer CLI, subtle motion, terminal-oriented",
      limit: 5,
    });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.score).toBeGreaterThan(0.5);
    expect(results[0]?.reasons.length).toBeGreaterThan(0);

    // The query asks for a hero with terminal treatment, so both readings must
    // be reachable near the top rather than one crowding the other out.
    const topCategories = results.map((r) => r.component.category);
    expect(topCategories).toContain("hero");
    const terminal = searchRegistry(all, {
      query: "terminal command palette developer tool",
      limit: 5,
    });
    expect(terminal.map((r) => r.component.category)).toContain("terminal");
  });

  it("keeps pricing candidates near top for saas pricing query", () => {
    const results = searchRegistry(all, { query: "minimal saas pricing cards", limit: 5 });
    const ids = results.map((r) => r.component.id);
    expect(ids.some((id) => id.includes("pricing"))).toBe(true);
    expect(results[0]?.component.category).toBe("pricing");
  });

  it("finds grid background for animated grid query", () => {
    const results = searchRegistry(all, { query: "animated grid background subtle", limit: 5 });
    expect(results[0]?.component.category).toBe("background");
  });

  it("finds command menu for developer command query", () => {
    const results = searchRegistry(all, { query: "developer command menu", limit: 5 });
    expect(results[0]?.component.category).toBe("command-menu");
  });

  it("filters by framework strictly", () => {
    const results = searchRegistry(all, { query: "hero", framework: "vue", limit: 10 });
    expect(results).toEqual([]);
  });

  it("filters by category and source", () => {
    const results = searchRegistry(all, { query: "hero", category: "hero", source: "aceternity" });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.component.source === "aceternity")).toBe(true);
  });

  it("sorts deterministically for same snapshot", () => {
    const a = searchRegistry(all, { query: "dark hero", limit: 10 });
    const b = searchRegistry(all, { query: "dark hero", limit: 10 });
    expect(a.map((r) => r.component.id)).toEqual(b.map((r) => r.component.id));
  });

  it("scores unknown license lower than known", () => {
    const known = all.find((c) => c.id === "efferd/pricing-1")!;
    const unknown = all.find((c) => c.id === "efferd/hero-1")!;
    expect(known.license.status).toBe("known");
    expect(unknown.license.status).toBe("unknown");
    const intent = inferQueryIntent("terminal dark");
    expect(scoreComponent(unknown, intent).score).toBeLessThan(
      scoreComponent({ ...unknown, license: known.license }, intent).score,
    );
  });

  it("gets by id and throws a stable code on unknown", () => {
    expect(getComponent(all, "beui/table").id).toBe("beui/table");
    // One code for one condition, shared with artifact retrieval: a caller must
    // not have to special-case which tool produced the miss.
    expect(() => getComponent(all, "nope/nope")).toThrow(
      expect.objectContaining({ code: "component-not-found" }),
    );
  });

  it("finds similar components", () => {
    const sim = findSimilar(all, "aceternity/terminal", 3);
    expect(sim).toHaveLength(3);
    expect(sim.every((r) => r.component.id !== "aceternity/terminal")).toBe(true);
  });

  it("searches patterns with explanation prefix", () => {
    const res = searchPatterns(all, "developer tool hero with terminal and subtle grid", 3);
    expect(res[0]?.reasons[0]).toMatch(/pattern match/);
    expect(res.length).toBeGreaterThan(0);
  });

  it("rejects unsupported framework and bad limit", () => {
    expect(() => searchRegistry(all, { query: "x", framework: "cobol" })).toThrow();
    expect(() => searchRegistry(all, { query: "x", limit: 0 })).toThrow();
  });
});

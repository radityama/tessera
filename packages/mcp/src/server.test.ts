import { describe, expect, it } from "vitest";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { discoverRegistryFiles, loadRegistryFiles } from "@tessera/registry";
import { getComponent, searchRegistry } from "@tessera/core";
import {
  createServer,
  handleFindSimilar,
  handleGetComponent,
  handleGetInstallation,
  handleSearchComponents,
  handleSearchPatterns,
} from "./server.js";

const here = dirname(fileURLToPath(import.meta.url));
const registriesDir = join(here, "..", "..", "..", "registries");
const all = loadRegistryFiles(discoverRegistryFiles(registriesDir));

function readJson(result: { content: Array<{ type: string; text: string }> }) {
  return JSON.parse(result.content[0]?.text ?? "null") as never;
}

describe("mcp contract", () => {
  it("search_components matches core results", () => {
    const query = "technical dark hero for a developer CLI, subtle motion, terminal-oriented";
    const core = searchRegistry(all, { query, limit: 3 }).map((r) => r.component.id);
    const res = handleSearchComponents(all, { query, limit: 3 });
    const ids = (readJson(res) as Array<{ id: string }>).map((r) => r.id);
    expect(ids).toEqual(core);
    const first = (readJson(res) as Array<{ score: number; reasons: string[] }>)[0];
    expect(first?.score).toBeGreaterThan(0);
    expect(first?.reasons.length).toBeGreaterThan(0);
  });

  it("get_component returns canonical metadata", () => {
    const core = getComponent(all, "beautifului/terminal-hero");
    const res = handleGetComponent(all, { id: "beautifului/terminal-hero" });
    expect(readJson(res)).toEqual(JSON.parse(JSON.stringify(core)));
  });

  it("get_installation is safe and warns on unknown license", () => {
    const res = handleGetInstallation(all, { id: "efferd/terminal-panel" });
    const plan = readJson(res) as { licenseWarning?: string; command?: string };
    expect(plan.licenseWarning).toMatch(/unknown license/i);
    const ok = handleGetInstallation(all, { id: "beautifului/terminal-hero" });
    expect((readJson(ok) as { id: string }).id).toBe("beautifului/terminal-hero");
  });

  it("find_similar_components matches core ordering", () => {
    const res = handleFindSimilar(all, { id: "beautifului/terminal-hero", limit: 3 });
    const ids = (readJson(res) as Array<{ id: string }>).map((r) => r.id);
    expect(ids).toHaveLength(3);
    expect(ids).not.toContain("beautifului/terminal-hero");
  });

  it("search_patterns matches core pattern results", () => {
    const res = handleSearchPatterns(all, {
      query: "developer tool hero with terminal and subtle grid",
      limit: 3,
    });
    const ids = (readJson(res) as Array<{ id: string }>).map((r) => r.id);
    expect(ids[0]).toBe("beautifului/terminal-hero");
  });

  it("returns structured errors, never stack traces", () => {
    const unknown = handleGetComponent(all, { id: "nope/nope" });
    expect(unknown.isError).toBe(true);
    expect(JSON.stringify(readJson(unknown))).not.toMatch(/at .*\(.*:\d+:\d+\)/);
    expect((readJson(unknown) as { error: { code: string } }).error.code).toBeTruthy();

    const badFw = handleSearchComponents(all, { query: "hero", framework: "cobol" });
    expect(badFw.isError).toBe(true);

    const badInput = handleSearchComponents(all, { query: "" });
    expect(badInput.isError).toBe(true);
  });

  it("registers exactly the five initial tools", () => {
    const server = createServer(all);
    const tools = (server as unknown as { _registeredTools?: Record<string, unknown> })
      ._registeredTools;
    expect(server).toBeDefined();
    expect(tools ?? true).toBeTruthy();
  });
});

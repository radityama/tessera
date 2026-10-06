import { describe, expect, it } from "vitest";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { discoverRegistryFiles, loadRegistryFiles } from "@tessera-dev/registry";
import { buildInstallationPlan, getComponent, searchRegistry } from "@tessera-dev/core";
import { formatAddPlanHuman, formatInspectHuman, formatSearchHuman } from "./format.js";
import { buildProgram, safeJoin } from "./cli.js";

const here = dirname(fileURLToPath(import.meta.url));
const registriesDir = join(here, "..", "..", "..", "registries");
const all = loadRegistryFiles(discoverRegistryFiles(registriesDir));

describe("cli", () => {
  it("formats search results with score and reasons", () => {
    const results = searchRegistry(all, { query: "dark technical terminal hero", limit: 2 });
    const text = formatSearchHuman(results);
    expect(text).toContain(results[0]?.component.id ?? "");
    expect(text).toContain("why:");
  });

  it("formats empty results without failing", () => {
    expect(formatSearchHuman([])).toMatch(/no results/i);
  });

  it("inspects canonical metadata", () => {
    const c = getComponent(all, "aceternity/terminal");
    const text = formatInspectHuman(c);
    expect(text).toContain("aceternity/terminal");
    expect(text).toContain("installation:");
  });

  it("builds a dry-run add plan with license warning for unknown licenses", () => {
    const unknown = getComponent(all, "efferd/hero-1");
    const plan = buildInstallationPlan(unknown);
    expect(plan.licenseWarning).toMatch(/unknown license/i);
    expect(formatAddPlanHuman(plan)).toMatch(/dry-run/i);
  });

  it("exposes search/inspect/similar/add/fetch commands", () => {
    const program = buildProgram();
    expect(program.commands.map((c) => c.name())).toEqual(
      expect.arrayContaining(["search", "inspect", "similar", "add", "fetch"]),
    );
  });

  it("describes fetch as read-only unless an output directory is given", () => {
    const program = buildProgram();
    const fetch = program.commands.find((c) => c.name() === "fetch");
    expect(fetch).toBeDefined();
    expect(fetch?.description()).toMatch(/retrieve/i);
    expect(fetch?.options.map((o) => o.long).sort()).toEqual(
      ["--dry-run", "--force", "--json", "--output", "--registry"].sort(),
    );
  });

  it("refuses artifact paths that would escape the output directory", () => {
    const root = "/tmp/tessera-fetch-test";
    expect(safeJoin(root, "components/ui/terminal.tsx")).toBe(
      "/tmp/tessera-fetch-test/components/ui/terminal.tsx",
    );
    expect(safeJoin(root, "../../etc/passwd")).toBeUndefined();
    expect(safeJoin(root, "/etc/passwd")).toBeUndefined();
    expect(safeJoin(root, "a/../../b")).toBeUndefined();
    expect(safeJoin(root, "..\\..\\windows\\system32")).toBeUndefined();
    expect(safeJoin(root, "")).toBeUndefined();
  });

  it("cli json search matches core results", () => {
    const results = searchRegistry(all, { query: "minimal saas pricing cards", limit: 3 });
    const json = JSON.stringify(results.map((r) => ({ id: r.component.id, score: r.score })));
    const reparsed = JSON.parse(json) as Array<{ id: string }>;
    expect(reparsed[0]?.id).toBe(results[0]?.component.id);
  });
});

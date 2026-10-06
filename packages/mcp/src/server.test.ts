import { describe, expect, it } from "vitest";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { discoverRegistryFiles, loadRegistryFiles } from "@tessera/registry";
import { getComponent, searchRegistry } from "@tessera/core";
import {
  createServer,
  handleFindSimilar,
  handleGetComponent,
  handleGetComponentArtifact,
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
    const core = getComponent(all, "aceternity/terminal");
    const res = handleGetComponent(all, { id: "aceternity/terminal" });
    expect(readJson(res)).toEqual(JSON.parse(JSON.stringify(core)));
  });

  it("get_installation is safe and warns on unknown license", () => {
    const res = handleGetInstallation(all, { id: "efferd/hero-1" });
    const plan = readJson(res) as { licenseWarning?: string; command?: string };
    expect(plan.licenseWarning).toMatch(/unknown license/i);
    const ok = handleGetInstallation(all, { id: "aceternity/terminal" });
    expect((readJson(ok) as { id: string }).id).toBe("aceternity/terminal");
  });

  it("find_similar_components matches core ordering", () => {
    const res = handleFindSimilar(all, { id: "aceternity/terminal", limit: 3 });
    const ids = (readJson(res) as Array<{ id: string }>).map((r) => r.id);
    expect(ids).toHaveLength(3);
    expect(ids).not.toContain("aceternity/terminal");
  });

  it("search_patterns matches core pattern results", () => {
    const res = handleSearchPatterns(all, {
      query: "developer tool hero with terminal and subtle grid",
      limit: 3,
    });
    const ids = (readJson(res) as Array<{ id: string }>).map((r) => r.id);
    expect(ids.length).toBeGreaterThan(0);
    const first = readJson(res) as Array<{ reasons: string[] }>;
    expect(first[0]?.reasons[0]).toMatch(/pattern match/);
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

  it("registers exactly the six documented tools", () => {
    const server = createServer(all);
    const tools = (server as unknown as { _registeredTools?: Record<string, unknown> })
      ._registeredTools;
    expect(Object.keys(tools ?? {}).sort()).toEqual([
      "find_similar_components",
      "get_component",
      "get_component_artifact",
      "get_installation",
      "search_components",
      "search_patterns",
    ]);
  });
});

describe("mcp artifact contract", () => {
  const ORIGIN = "https://ui.aceternity.com";
  const payload = {
    name: "terminal",
    dependencies: ["motion"],
    files: [{ path: "components/ui/terminal.tsx", content: "export const T = 1" }],
  };
  const fetchImpl = (async () =>
    new Response(JSON.stringify(payload), {
      status: 200,
      headers: { "content-type": "application/json" },
    })) as unknown as typeof fetch;

  it("returns real files with provenance and license for a retrievable component", async () => {
    const res = await handleGetComponentArtifact(all, { id: "aceternity/terminal" }, { fetchImpl });
    expect(res.isError).toBeUndefined();
    const artifact = readJson(res) as {
      id: string;
      source: { provider: string; upstreamUrl: string };
      files: Array<{ path: string; content: string }>;
      dependencies: string[];
      license: { identifier?: string; redistribution?: string };
    };
    expect(artifact.id).toBe("aceternity/terminal");
    expect(artifact.source.provider).toBe("aceternity");
    expect(artifact.source.upstreamUrl).toContain(ORIGIN);
    expect(artifact.files[0]?.path).toBe("components/ui/terminal.tsx");
    expect(artifact.dependencies).toEqual(["motion"]);
    expect(artifact.license.identifier).toBe("LicenseRef-Aceternity");
    expect(artifact.license.redistribution).toBe("restricted");
  });

  it("returns a structured error for a component with no retrievable artifact", async () => {
    const res = await handleGetComponentArtifact(all, { id: "heroui/button" }, { fetchImpl });
    expect(res.isError).toBe(true);
    const body = readJson(res) as { error: { code: string; message: string } };
    expect(body.error.code).toBe("artifact-unavailable");
    expect(body.error.message).toContain("@heroui/react");
  });

  it("returns a structured error for an unknown id", async () => {
    const res = await handleGetComponentArtifact(all, { id: "nope/nope" }, { fetchImpl });
    expect(res.isError).toBe(true);
    expect((readJson(res) as { error: { code: string } }).error.code).toBe("component-not-found");
  });

  it("never leaks a stack trace through the artifact tool", async () => {
    const failing = (async () => {
      throw new Error("network down");
    }) as unknown as typeof fetch;
    const res = await handleGetComponentArtifact(
      all,
      { id: "aceternity/terminal" },
      {
        fetchImpl: failing,
      },
    );
    expect(res.isError).toBe(true);
    expect(JSON.stringify(readJson(res))).not.toMatch(/at .*\(.*:\d+:\d+\)/);
    expect((readJson(res) as { error: { code: string } }).error.code).toBe("provider-unreachable");
  });

  it("advertises retrievability in search results so agents need not guess", () => {
    const res = handleSearchComponents(all, { query: "terminal", limit: 10 });
    const results = readJson(res) as Array<{
      id: string;
      retrievable: boolean;
      retrievalKind: string;
    }>;
    const aceternity = results.find((r) => r.id === "aceternity/terminal");
    expect(aceternity?.retrievable).toBe(true);
    expect(aceternity?.retrievalKind).toBe("shadcn-registry");
    const heroui = results.find((r) => r.retrievalKind === "npm-package");
    if (heroui) expect(heroui.retrievable).toBe(false);
  });
});

import { describe, expect, it, vi } from "vitest";
import type { TesseraComponent } from "@tessera/registry";
import {
  RetrievalError,
  allowedOrigins,
  isRetrievable,
  resolveComponentArtifact,
} from "./retrieval.js";

/**
 * Every test here uses an injected fetch. The suite must pass offline: a test
 * that needs a third party's uptime is a test that fails for reasons unrelated
 * to this repository.
 */

const ORIGIN = "https://registry.example";

function component(id: string, retrieval: TesseraComponent["retrieval"]): TesseraComponent {
  const [source, slug] = id.split("/");
  return {
    schemaVersion: 2,
    id,
    source: source as string,
    slug: slug as string,
    name: "Terminal",
    category: "terminal",
    secondaryCategories: [],
    frameworks: ["react"],
    compatibility: {},
    visual: {
      aesthetics: [],
      tags: [],
      motion: "unknown",
      density: "unknown",
      radius: "unknown",
      surface: ["unknown"],
    },
    dependencies: [],
    installation: { kind: "command" },
    retrieval,
    links: { homepage: `${ORIGIN}/`, docs: `${ORIGIN}/components` },
    license: { status: "known", identifier: "MIT", source: `${ORIGIN}/LICENSE` },
    provenance: { adapter: "test", derivedFields: [] },
  };
}

const shadcnComponent = component("prov/terminal", {
  kind: "shadcn-registry",
  itemUrl: `${ORIGIN}/r/terminal.json`,
  registryName: "@prov",
  installCommand: "npx shadcn@latest add @prov/terminal",
});

const registry: TesseraComponent[] = [shadcnComponent];

const validPayload = {
  name: "terminal",
  type: "registry:ui",
  dependencies: ["motion", "clsx@2.0.0"],
  registryDependencies: ["utils"],
  files: [
    { path: "components/ui/terminal.tsx", type: "registry:ui", content: "export const T = 1" },
  ],
};

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
    ...init,
  });
}

function fetchReturning(res: Response | (() => Response | Promise<Response>)) {
  return vi.fn(async () =>
    typeof res === "function" ? await res() : res,
  ) as unknown as typeof fetch;
}

describe("resolveComponentArtifact", () => {
  it("returns validated files with provenance from a real registry item shape", async () => {
    const artifact = await resolveComponentArtifact(registry, "prov/terminal", {
      fetchImpl: fetchReturning(jsonResponse(validPayload)),
      now: () => new Date("2026-10-06T12:00:00.000Z"),
    });

    expect(artifact.id).toBe("prov/terminal");
    expect(artifact.source).toEqual({
      provider: "prov",
      upstreamUrl: `${ORIGIN}/r/terminal.json`,
    });
    expect(artifact.files).toHaveLength(1);
    expect(artifact.files[0]?.path).toBe("components/ui/terminal.tsx");
    expect(artifact.files[0]?.content).toBe("export const T = 1");
    expect(artifact.dependencies).toEqual(["motion", "clsx@2.0.0"]);
    expect(artifact.registryDependencies).toEqual(["utils"]);
    expect(artifact.installCommand).toBe("npx shadcn@latest add @prov/terminal");
    expect(artifact.retrievedAt).toBe("2026-10-06T12:00:00.000Z");
  });

  it("carries the component's license onto the artifact", async () => {
    const artifact = await resolveComponentArtifact(registry, "prov/terminal", {
      fetchImpl: fetchReturning(jsonResponse(validPayload)),
    });
    expect(artifact.license.identifier).toBe("MIT");
    expect(artifact.license.source).toBe(`${ORIGIN}/LICENSE`);
  });

  it("never executes returned content", async () => {
    const payload = {
      ...validPayload,
      files: [{ path: "x.tsx", content: "throw new Error('executed')" }],
    };
    const artifact = await resolveComponentArtifact(registry, "prov/terminal", {
      fetchImpl: fetchReturning(jsonResponse(payload)),
    });
    expect(artifact.files[0]?.content).toBe("throw new Error('executed')");
  });

  it("reports an unknown id without attempting a fetch", async () => {
    const impl = fetchReturning(jsonResponse(validPayload));
    await expect(
      resolveComponentArtifact(registry, "nope/nope", { fetchImpl: impl }),
    ).rejects.toMatchObject({ code: "component-not-found" });
    expect(impl).not.toHaveBeenCalled();
  });

  it("explains that a metadata-only component has no artifact", async () => {
    const reg = [component("prov/plain", { kind: "none" })];
    await expect(
      resolveComponentArtifact(reg, "prov/plain", { fetchImpl: fetchReturning(jsonResponse({})) }),
    ).rejects.toMatchObject({ code: "artifact-unavailable" });
  });

  it("redirects npm-distributed components to their package manager", async () => {
    const reg = [component("prov/pkg", { kind: "npm-package", package: "@prov/react" })];
    await expect(
      resolveComponentArtifact(reg, "prov/pkg", { fetchImpl: fetchReturning(jsonResponse({})) }),
    ).rejects.toMatchObject({ code: "artifact-unavailable" });
    try {
      await resolveComponentArtifact(reg, "prov/pkg", {
        fetchImpl: fetchReturning(jsonResponse({})),
      });
    } catch (err) {
      expect((err as Error).message).toContain("@prov/react");
    }
  });

  it("refuses to fetch an origin outside the registry-derived allowlist", async () => {
    const rogue = component("prov/rogue", {
      kind: "shadcn-registry",
      itemUrl: "https://evil.example/r/x.json",
    });
    const impl = fetchReturning(jsonResponse(validPayload));
    await expect(
      resolveComponentArtifact([rogue], "prov/rogue", { fetchImpl: impl }),
    ).rejects.toMatchObject({ code: "blocked-origin" });
    expect(impl).not.toHaveBeenCalled();
  });

  it("refuses a redirect that leaves the allowlist", async () => {
    const impl = vi.fn(
      async () =>
        new Response(null, { status: 302, headers: { location: "https://evil.example/x.json" } }),
    ) as unknown as typeof fetch;
    await expect(
      resolveComponentArtifact(registry, "prov/terminal", { fetchImpl: impl }),
    ).rejects.toMatchObject({ code: "blocked-origin" });
  });

  it("follows a redirect that stays on an allowlisted origin", async () => {
    let call = 0;
    const impl = vi.fn(async () => {
      call += 1;
      if (call === 1) {
        return new Response(null, { status: 302, headers: { location: `${ORIGIN}/r/moved.json` } });
      }
      return jsonResponse(validPayload);
    }) as unknown as typeof fetch;

    const artifact = await resolveComponentArtifact(registry, "prov/terminal", { fetchImpl: impl });
    expect(artifact.source.upstreamUrl).toBe(`${ORIGIN}/r/moved.json`);
  });

  it("gives up after too many redirects", async () => {
    const impl = vi.fn(
      async () =>
        new Response(null, { status: 302, headers: { location: `${ORIGIN}/r/loop.json` } }),
    ) as unknown as typeof fetch;
    await expect(
      resolveComponentArtifact(registry, "prov/terminal", { fetchImpl: impl, maxRedirects: 2 }),
    ).rejects.toMatchObject({ code: "provider-contract-invalid" });
  });

  it("reports an auth-gated item as unavailable rather than broken", async () => {
    for (const status of [401, 403, 404]) {
      const impl = fetchReturning(new Response("nope", { status }));
      await expect(
        resolveComponentArtifact(registry, "prov/terminal", { fetchImpl: impl }),
      ).rejects.toMatchObject({ code: "artifact-unavailable" });
    }
  });

  it("reports a server error as an upstream problem, not a contract problem", async () => {
    const impl = fetchReturning(new Response("boom", { status: 500 }));
    await expect(
      resolveComponentArtifact(registry, "prov/terminal", { fetchImpl: impl }),
    ).rejects.toMatchObject({ code: "provider-unreachable" });
  });

  it("treats a timeout as unreachable", async () => {
    const impl = vi.fn(
      async (_url: string, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            const err = new Error("aborted");
            err.name = "AbortError";
            reject(err);
          });
        }),
    ) as unknown as typeof fetch;

    await expect(
      resolveComponentArtifact(registry, "prov/terminal", { fetchImpl: impl, timeoutMs: 5 }),
    ).rejects.toMatchObject({ code: "provider-unreachable" });
  });

  it("rejects a non-JSON response", async () => {
    const impl = fetchReturning(new Response("<html>", { status: 200 }));
    await expect(
      resolveComponentArtifact(registry, "prov/terminal", { fetchImpl: impl }),
    ).rejects.toMatchObject({ code: "provider-contract-invalid" });
  });

  it("rejects a payload that does not match the registry item contract", async () => {
    const impl = fetchReturning(jsonResponse({ name: "terminal" }));
    await expect(
      resolveComponentArtifact(registry, "prov/terminal", { fetchImpl: impl }),
    ).rejects.toMatchObject({ code: "provider-contract-invalid" });
  });

  it("rejects a payload whose files carry no content", async () => {
    const impl = fetchReturning(
      jsonResponse({ name: "x", files: [{ path: "a.tsx", content: "" }] }),
    );
    await expect(
      resolveComponentArtifact(registry, "prov/terminal", { fetchImpl: impl }),
    ).rejects.toMatchObject({ code: "provider-contract-invalid" });
  });

  it("enforces the response size cap", async () => {
    const impl = fetchReturning(
      jsonResponse({ ...validPayload, files: [{ path: "a.tsx", content: "x".repeat(5000) }] }),
    );
    await expect(
      resolveComponentArtifact(registry, "prov/terminal", { fetchImpl: impl, maxBytes: 500 }),
    ).rejects.toMatchObject({ code: "response-too-large" });
  });

  it("rejects a declared content-length over the cap before reading", async () => {
    const impl = fetchReturning(
      jsonResponse(validPayload, { headers: { "content-length": "999999" } }),
    );
    await expect(
      resolveComponentArtifact(registry, "prov/terminal", { fetchImpl: impl, maxBytes: 500 }),
    ).rejects.toMatchObject({ code: "response-too-large" });
  });

  it("never lets a caller supply a URL", async () => {
    // The API takes an id, not a URL; a URL-shaped id simply does not resolve.
    await expect(
      resolveComponentArtifact(registry, "https://evil.example/x.json", {
        fetchImpl: fetchReturning(jsonResponse(validPayload)),
      }),
    ).rejects.toMatchObject({ code: "component-not-found" });
  });
});

describe("allowedOrigins", () => {
  it("derives origins from retrieval metadata and advertised links", () => {
    const origins = allowedOrigins(registry);
    expect(origins.has(ORIGIN)).toBe(true);
    expect(origins.has("https://evil.example")).toBe(false);
  });
});

describe("isRetrievable", () => {
  it("distinguishes fetchable components from metadata-only ones", () => {
    expect(isRetrievable(shadcnComponent)).toBe(true);
    expect(isRetrievable(component("prov/pkg", { kind: "npm-package", package: "x" }))).toBe(false);
    expect(isRetrievable(component("prov/plain", { kind: "none" }))).toBe(false);
  });
});

describe("RetrievalError", () => {
  it("carries a stable machine-readable code", () => {
    const err = new RetrievalError("blocked-origin", "nope", { url: "x" });
    expect(err.code).toBe("blocked-origin");
    expect(err.detail).toEqual({ url: "x" });
    expect(err).toBeInstanceOf(Error);
  });
});

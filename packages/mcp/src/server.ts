import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  buildInstallationPlan,
  findSimilar,
  getComponent,
  resolveComponentArtifact,
  searchPatterns,
  searchRegistry,
  type RetrievalOptions,
} from "@tessera/core";
import type { TesseraComponent } from "@tessera/registry";

export const SearchComponentsInput = z.object({
  query: z.string().min(1),
  category: z.string().optional(),
  framework: z.string().optional(),
  limit: z.number().int().min(1).max(50).optional(),
});

export const GetComponentInput = z.object({ id: z.string().min(1) });
export const GetInstallationInput = z.object({ id: z.string().min(1) });
export const GetComponentArtifactInput = z.object({ id: z.string().min(1) });
export const FindSimilarInput = z.object({
  id: z.string().min(1),
  limit: z.number().int().min(1).max(50).optional(),
});
export const SearchPatternsInput = z.object({
  query: z.string().min(1),
  limit: z.number().int().min(1).max(50).optional(),
});

function summarize(c: TesseraComponent) {
  return {
    id: c.id,
    name: c.name,
    source: c.source,
    category: c.category,
    visualTags: c.visual.tags,
    frameworks: c.frameworks,
    dependencyCount: c.dependencies.filter((d) => d.required).length,
    motion: c.visual.motion,
    license: c.license.status,
    licenseRedistribution: c.license.redistribution ?? "unknown",
    // Whether an artifact can be fetched at all, so an agent does not discover
    // it only when retrieval fails.
    retrievable: c.retrieval.kind === "shadcn-registry" || c.retrieval.kind === "raw-source",
    retrievalKind: c.retrieval.kind,
  };
}

function errText(code: string, message: string, detail?: Record<string, unknown>): string {
  return JSON.stringify({ error: { code, message, ...(detail ? { detail } : {}) } });
}

function errCode(err: unknown): string {
  return (err as { code?: string }).code ?? "internal-error";
}

function errDetail(err: unknown): Record<string, unknown> | undefined {
  const detail = (err as { detail?: unknown }).detail;
  return detail && typeof detail === "object" ? (detail as Record<string, unknown>) : undefined;
}

export function handleSearchComponents(components: TesseraComponent[], args: unknown) {
  try {
    const input = SearchComponentsInput.parse(args);
    const results = searchRegistry(components, input);
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            results.map((r) => ({
              ...summarize(r.component),
              dependencies: r.component.dependencies,
              licenseStatus: r.component.license.status,
              licenseDetail: r.component.license,
              score: r.score,
              reasons: r.reasons,
            })),
          ),
        },
      ],
    };
  } catch (err) {
    return {
      content: [{ type: "text" as const, text: errText(errCode(err), (err as Error).message) }],
      isError: true as const,
    };
  }
}

export function handleGetComponent(components: TesseraComponent[], args: unknown) {
  try {
    const input = GetComponentInput.parse(args);
    const c = getComponent(components, input.id);
    return { content: [{ type: "text" as const, text: JSON.stringify(c) }] };
  } catch (err) {
    return {
      content: [{ type: "text" as const, text: errText(errCode(err), (err as Error).message) }],
      isError: true as const,
    };
  }
}

export function handleGetInstallation(components: TesseraComponent[], args: unknown) {
  try {
    const input = GetInstallationInput.parse(args);
    const c = getComponent(components, input.id);
    return { content: [{ type: "text" as const, text: JSON.stringify(buildInstallationPlan(c)) }] };
  } catch (err) {
    return {
      content: [{ type: "text" as const, text: errText(errCode(err), (err as Error).message) }],
      isError: true as const,
    };
  }
}

export async function handleGetComponentArtifact(
  components: TesseraComponent[],
  args: unknown,
  options: RetrievalOptions = {},
) {
  try {
    const input = GetComponentArtifactInput.parse(args);
    const artifact = await resolveComponentArtifact(components, input.id, options);
    return { content: [{ type: "text" as const, text: JSON.stringify(artifact) }] };
  } catch (err) {
    return {
      content: [
        {
          type: "text" as const,
          text: errText(errCode(err), (err as Error).message, errDetail(err)),
        },
      ],
      isError: true as const,
    };
  }
}

export function handleFindSimilar(components: TesseraComponent[], args: unknown) {
  try {
    const input = FindSimilarInput.parse(args);
    const results = findSimilar(components, input.id, input.limit ?? 5);
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            results.map((r) => ({ ...summarize(r.component), score: r.score, reasons: r.reasons })),
          ),
        },
      ],
    };
  } catch (err) {
    return {
      content: [{ type: "text" as const, text: errText(errCode(err), (err as Error).message) }],
      isError: true as const,
    };
  }
}

export function handleSearchPatterns(components: TesseraComponent[], args: unknown) {
  try {
    const input = SearchPatternsInput.parse(args);
    const results = searchPatterns(components, input.query, input.limit ?? 10);
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            results.map((r) => ({ ...summarize(r.component), score: r.score, reasons: r.reasons })),
          ),
        },
      ],
    };
  } catch (err) {
    return {
      content: [{ type: "text" as const, text: errText(errCode(err), (err as Error).message) }],
      isError: true as const,
    };
  }
}

export function createServer(components: TesseraComponent[]): McpServer {
  const server = new McpServer({ name: "tessera", version: "0.1.0" });

  server.registerTool(
    "search_components",
    {
      description: "Search and rank UI components by natural-language query with optional filters.",
      inputSchema: SearchComponentsInput,
    },
    async (args) => handleSearchComponents(components, args),
  );
  server.registerTool(
    "get_component",
    {
      description: "Return complete canonical metadata for one component id.",
      inputSchema: GetComponentInput,
    },
    async (args) => handleGetComponent(components, args),
  );
  server.registerTool(
    "get_installation",
    {
      description: "Return safe installation guidance for one component id (never executes).",
      inputSchema: GetInstallationInput,
    },
    async (args) => handleGetInstallation(components, args),
  );
  server.registerTool(
    "get_component_artifact",
    {
      description:
        "Retrieve the actual source files for a component from its upstream provider, with dependencies and license. Tessera returns the files only; it never writes, installs or executes them. Use get_installation for a plan instead.",
      inputSchema: GetComponentArtifactInput,
    },
    async (args) => handleGetComponentArtifact(components, args),
  );
  server.registerTool(
    "find_similar_components",
    {
      description: "Return alternatives to a component by category, aesthetics, motion and stack.",
      inputSchema: FindSimilarInput,
    },
    async (args) => handleFindSimilar(components, args),
  );
  server.registerTool(
    "search_patterns",
    {
      description: "Search higher-level UI patterns rather than exact component names.",
      inputSchema: SearchPatternsInput,
    },
    async (args) => handleSearchPatterns(components, args),
  );

  return server;
}

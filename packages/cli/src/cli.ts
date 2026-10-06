#!/usr/bin/env node
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve, sep } from "node:path";
import { Command } from "commander";
import {
  buildInstallationPlan,
  findSimilar,
  getComponent,
  resolveComponentArtifact,
  searchRegistry,
} from "@tessera-dev/core";
import {
  formatAddPlanHuman,
  formatArtifactHuman,
  formatInspectHuman,
  formatSearchHuman,
  type FetchPlanEntry,
} from "./format.js";
import type { TesseraComponent } from "@tessera-dev/registry";
import { loadDefaultRegistry } from "./registry.js";

/**
 * Resolve an upstream-declared file path inside a target directory.
 *
 * Artifact paths come from a third party, so they are treated as untrusted:
 * absolute paths and any `..` segment are rejected rather than normalised, and
 * the result must stay inside the target directory.
 */
export function safeJoin(root: string, relative: string): string | undefined {
  const normalized = relative.replace(/\\/g, "/");
  if (normalized.startsWith("/") || /^[a-zA-Z]:/.test(normalized)) return undefined;
  if (normalized.split("/").some((part) => part === ".." || part === "")) return undefined;
  const rootResolved = resolve(root);
  const full = resolve(rootResolved, normalized);
  if (full !== rootResolved && !full.startsWith(rootResolved + sep)) return undefined;
  return full;
}

export function buildProgram(): Command {
  const program = new Command();
  program.name("tessera").description("UI retrieval for coding agents").version("0.1.0");

  program
    .command("search")
    .description("search and rank components")
    .argument("<query>", "natural-language query")
    .option("--category <category>", "filter by category")
    .option("--framework <framework>", "filter by framework (react|vue|svelte|html|other)")
    .option("--source <source>", "filter by source library")
    .option("--motion <motion>", "filter by motion level (none|low|medium|high)")
    .option("--limit <n>", "max results (1..50)", "10")
    .option("--json", "stable JSON output for scripting")
    .option("--registry <dir>", "registries directory")
    .action((query: string, opts) => {
      try {
        const registry = loadDefaultRegistry(opts.registry);
        const results = searchRegistry(registry, {
          query,
          category: opts.category,
          framework: opts.framework,
          source: opts.source,
          motion: opts.motion,
          limit: Number(opts.limit),
        });
        if (opts.json) {
          console.log(
            JSON.stringify(
              results.map((r) => ({
                id: r.component.id,
                name: r.component.name,
                source: r.component.source,
                category: r.component.category,
                visualTags: r.component.visual.tags,
                frameworks: r.component.frameworks,
                dependencyCount: r.component.dependencies.filter((d) => d.required).length,
                motion: r.component.visual.motion,
                license: r.component.license,
                score: r.score,
                reasons: r.reasons,
              })),
              null,
              2,
            ),
          );
        } else {
          console.log(formatSearchHuman(results));
        }
      } catch (err) {
        reportError(err);
      }
    });

  program
    .command("inspect")
    .description("show canonical metadata for one component")
    .argument("<id>", "component id (<source>/<slug>)")
    .option("--json", "stable JSON output")
    .option("--registry <dir>", "registries directory")
    .action((id: string, opts) => {
      try {
        const registry = loadDefaultRegistry(opts.registry);
        const c = getComponent(registry, id);
        if (opts.json) console.log(JSON.stringify(c, null, 2));
        else console.log(formatInspectHuman(c));
      } catch (err) {
        reportError(err);
      }
    });

  program
    .command("similar")
    .description("find similar components")
    .argument("<id>", "component id (<source>/<slug>)")
    .option("--limit <n>", "max results", "5")
    .option("--json", "stable JSON output")
    .option("--registry <dir>", "registries directory")
    .action((id: string, opts) => {
      try {
        const registry = loadDefaultRegistry(opts.registry);
        const results = findSimilar(registry, id, Number(opts.limit));
        if (opts.json) {
          console.log(
            JSON.stringify(
              results.map((r) => ({ id: r.component.id, score: r.score, reasons: r.reasons })),
              null,
              2,
            ),
          );
        } else {
          console.log(formatSearchHuman(results));
        }
      } catch (err) {
        reportError(err);
      }
    });

  program
    .command("add")
    .description("print a safe installation plan (dry-run by default in v0.1)")
    .argument("<id>", "component id (<source>/<slug>)")
    .option("--dry-run", "only print the plan (default)", true)
    .option("--no-dry-run", "attempt mutation (not implemented in v0.1)")
    .option("--registry <dir>", "registries directory")
    .option("--json", "stable JSON output")
    .action((id: string, opts) => {
      try {
        if (opts.dryRun === false) {
          console.error(
            "tessera add: automatic mutation is not implemented in v0.1; use --dry-run",
          );
          process.exitCode = 1;
          return;
        }
        const registry = loadDefaultRegistry(opts.registry);
        const c = getComponent(registry, id);
        const plan = buildInstallationPlan(c);
        if (opts.json) console.log(JSON.stringify({ dryRun: true, plan }, null, 2));
        else console.log(formatAddPlanHuman(plan));
      } catch (err) {
        reportError(err);
      }
    });

  program
    .command("fetch")
    .description("retrieve a component's real source files from its upstream provider")
    .argument("<id>", "component id (<source>/<slug>)")
    .option("--json", "emit the artifact as JSON")
    .option("--output <dir>", "write files under this directory instead of printing them")
    .option("--dry-run", "show what would be written without writing anything")
    .option("--force", "overwrite existing files (refused by default)")
    .option("--registry <dir>", "registries directory")
    .action(async (id: string, opts) => {
      try {
        const registry = loadDefaultRegistry(opts.registry);
        const artifact = await resolveComponentArtifact(registry, id);

        if (!opts.output) {
          console.log(
            opts.json ? JSON.stringify(artifact, null, 2) : formatArtifactHuman(artifact),
          );
          return;
        }

        const root = resolve(opts.output);
        const plan: FetchPlanEntry[] = artifact.files.map((f) => {
          const target = safeJoin(root, f.path);
          if (!target) {
            return { path: f.path, bytes: f.content.length, action: "reject-unsafe-path" };
          }
          const exists = existsSync(target);
          return {
            path: f.path,
            bytes: f.content.length,
            action: exists ? (opts.force ? "overwrite" : "skip-exists") : "create",
          };
        });

        if (opts.dryRun) {
          console.log(
            opts.json
              ? JSON.stringify({ dryRun: true, plan }, null, 2)
              : formatArtifactHuman(artifact, plan),
          );
          return;
        }

        const unsafe = plan.filter((p) => p.action === "reject-unsafe-path");
        if (unsafe.length > 0) {
          console.error(
            JSON.stringify({
              error: {
                code: "unsafe-artifact-path",
                message: `refusing to write ${unsafe.length} file(s) outside the output directory`,
                detail: { paths: unsafe.map((u) => u.path) },
              },
            }),
          );
          process.exitCode = 1;
          return;
        }

        let written = 0;
        for (const [i, f] of artifact.files.entries()) {
          if (plan[i]?.action === "skip-exists") continue;
          const target = safeJoin(root, f.path);
          if (!target) continue;
          mkdirSync(dirname(target), { recursive: true });
          writeFileSync(target, f.content, "utf8");
          written += 1;
        }

        if (opts.json) {
          console.log(JSON.stringify({ dryRun: false, written, plan }, null, 2));
        } else {
          console.log(formatArtifactHuman(artifact, plan));
          console.log(`\nWrote ${written} file(s) under ${root}.`);
        }
      } catch (err) {
        reportError(err);
      }
    });

  program
    .command("mcp")
    .description("start the Tessera MCP server over stdio")
    .option("--registry <dir>", "registries directory")
    .action(async (opts) => {
      try {
        const { runStdio } = await import("@tessera-dev/mcp");
        if (opts.registry) process.env["TESSERA_REGISTRIES"] = String(opts.registry);
        // stdout belongs to the protocol; diagnostics go to stderr.
        await runStdio();
      } catch (err) {
        console.error(
          JSON.stringify({
            error: {
              code: (err as { code?: string }).code ?? "mcp-startup-error",
              message: err instanceof Error ? err.message : String(err),
            },
          }),
        );
        process.exit(1);
      }
    });

  program
    .command("doctor")
    .description("check that this installation can search, inspect and serve MCP")
    .option("--registry <dir>", "registries directory")
    .option("--json", "emit the report as JSON")
    .action(async (opts) => {
      const { describeRegistrySource } = await import("./registry.js");
      const checks: Array<{ name: string; ok: boolean; detail: string }> = [];
      const nodeMajor = Number(process.versions.node.split(".")[0]);

      checks.push({
        name: "node-version",
        ok: nodeMajor >= 20,
        detail: `node ${process.versions.node} (requires >=20)`,
      });

      const source = describeRegistrySource(opts.registry);
      checks.push({
        name: "registry-source",
        ok: source.kind !== "none",
        detail:
          source.kind === "none"
            ? "no registry found"
            : `${source.kind}${source.path ? ` (${source.path})` : ""}`,
      });

      let components: TesseraComponent[] = [];
      try {
        components = loadDefaultRegistry(opts.registry);
        checks.push({
          name: "registry-valid",
          ok: components.length > 0,
          detail: `${components.length} components across ${new Set(components.map((c) => c.source)).size} sources`,
        });
      } catch (err) {
        checks.push({
          name: "registry-valid",
          ok: false,
          detail: err instanceof Error ? err.message : String(err),
        });
      }

      if (components.length > 0) {
        const withoutRetrieval = components.filter((c) => !c.retrieval);
        const unevidenced = components.filter(
          (c) => c.license.status === "known" && !c.license.source,
        );
        checks.push({
          name: "registry-integrity",
          ok: withoutRetrieval.length === 0 && unevidenced.length === 0,
          detail: `${withoutRetrieval.length} without retrieval, ${unevidenced.length} with unevidenced licenses`,
        });

        let mcpOk = false;
        let mcpDetail = "";
        try {
          const { createServer } = await import("@tessera-dev/mcp");
          const server = createServer(components);
          const tools = Object.keys(
            (server as unknown as { _registeredTools?: Record<string, unknown> })
              ._registeredTools ?? {},
          );
          mcpOk = tools.length > 0;
          mcpDetail = `${tools.length} tools registered`;
        } catch (err) {
          mcpDetail = err instanceof Error ? err.message : String(err);
        }
        checks.push({ name: "mcp-server", ok: mcpOk, detail: mcpDetail });
      }

      const failed = checks.filter((c) => !c.ok);
      if (opts.json) {
        console.log(JSON.stringify({ ok: failed.length === 0, checks }, null, 2));
      } else {
        for (const c of checks) console.log(`${c.ok ? "ok  " : "FAIL"}  ${c.name}: ${c.detail}`);
        console.log(
          failed.length === 0 ? "\nAll checks passed." : `\n${failed.length} check(s) failed.`,
        );
      }
      if (failed.length > 0) process.exitCode = 1;
    });

  return program;
}

function reportError(err: unknown): void {
  const code = (err as { code?: string }).code ?? "internal-error";
  const message = err instanceof Error ? err.message : String(err);
  const detail = (err as { detail?: unknown }).detail;
  const payload: Record<string, unknown> = { code, message };
  if (detail && typeof detail === "object") payload.detail = detail;

  // Opt-in diagnostics. Never printed by default, and never includes headers,
  // tokens or other credentials — only the stack of an error we already raised.
  if (process.env["TESSERA_DEBUG"] === "1" && err instanceof Error && err.stack) {
    payload.stack = err.stack.split("\n").slice(0, 12).join("\n");
  }

  console.error(JSON.stringify({ error: payload }));
  process.exitCode = 1;
}

const program = buildProgram();
const invokedAsCli =
  typeof process.argv[1] === "string" &&
  (process.argv[1].endsWith("/cli.js") ||
    process.argv[1].endsWith("\\cli.js") ||
    process.argv[1].endsWith("tessera"));
if (invokedAsCli) {
  program.parseAsync(process.argv);
}

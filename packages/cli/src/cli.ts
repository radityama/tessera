#!/usr/bin/env node
import { Command } from "commander";
import { buildInstallationPlan, findSimilar, getComponent, searchRegistry } from "@tessera/core";
import { formatAddPlanHuman, formatInspectHuman, formatSearchHuman } from "./format.js";
import { loadDefaultRegistry } from "./registry.js";

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

  return program;
}

function reportError(err: unknown): void {
  const code = (err as { code?: string }).code ?? "internal-error";
  const message = err instanceof Error ? err.message : String(err);
  console.error(JSON.stringify({ error: { code, message } }));
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

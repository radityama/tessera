import type { RankedResult } from "@tessera/core";
import type { ComponentArtifact, License, TesseraComponent } from "@tessera/registry";

export function licenseLine(license: License): string {
  if (license.status === "unknown") {
    return "unknown — verify upstream terms before reuse";
  }
  const parts = [license.identifier ?? "known"];
  if (license.osiApproved === false) parts.push("not OSI-approved");
  if (license.redistribution === "restricted") parts.push("redistribution restricted");
  else if (license.redistribution === "permitted") parts.push("redistribution permitted");
  return parts.join(", ");
}

export function formatSearchHuman(results: RankedResult[]): string {
  if (results.length === 0) return "No results. Try broadening the query or removing filters.";
  return results
    .map((r, i) => {
      const c = r.component;
      const deps = c.dependencies.filter((d) => d.required).length;
      const retrievable =
        c.retrieval.kind === "shadcn-registry" || c.retrieval.kind === "raw-source";
      return [
        `${i + 1}. ${c.id} — ${c.name} (${r.score.toFixed(3)})`,
        `   category: ${c.category} | source: ${c.source} | frameworks: ${c.frameworks.join("/")}`,
        `   motion: ${c.visual.motion} | deps: ${deps} | license: ${licenseLine(c.license)}`,
        `   artifact: ${retrievable ? `retrievable (${c.retrieval.kind})` : `not retrievable (${c.retrieval.kind})`}`,
        `   why: ${r.reasons.join("; ")}`,
      ].join("\n");
    })
    .join("\n");
}

export function formatInspectHuman(c: TesseraComponent): string {
  const deps =
    c.dependencies.length === 0
      ? "none"
      : c.dependencies.map((d) => `${d.name} (${d.kind})`).join(", ");
  return [
    `${c.id} — ${c.name}`,
    c.description ?? "",
    `category: ${c.category} (secondary: ${c.secondaryCategories.join(", ") || "—"})`,
    `frameworks: ${c.frameworks.join(", ")}`,
    `visual: aesthetics=[${c.visual.aesthetics.join(", ")}] tags=[${c.visual.tags.join(", ")}] motion=${c.visual.motion} density=${c.visual.density}`,
    `dependencies: ${deps}`,
    `installation: ${c.installation.kind}${c.installation.command ? ` — ${c.installation.command}` : ""}${c.installation.instructions ? ` — ${c.installation.instructions}` : ""}`,
    `retrieval: ${c.retrieval.kind}${c.retrieval.kind === "shadcn-registry" ? ` — ${c.retrieval.itemUrl}` : ""}`,
    `license: ${licenseLine(c.license)}${c.license.notes ? ` — ${c.license.notes}` : ""}`,
    `links: ${
      Object.entries(c.links)
        .map(([k, v]) => `${k}=${v}`)
        .join(" ") || "—"
    }`,
    `provenance: adapter=${c.provenance.adapter}${c.provenance.upstreamName ? ` upstream=${c.provenance.upstreamName}` : ""}${c.provenance.derivedFields.length > 0 ? ` derived=[${c.provenance.derivedFields.join(", ")}]` : ""}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function formatAddPlanHuman(plan: {
  id: string;
  kind: string;
  command?: string | undefined;
  instructions?: string | undefined;
  dependencies: string[];
  licenseWarning?: string | undefined;
}): string {
  const lines = [
    `Plan for ${plan.id} (dry-run — no files changed):`,
    `- installation kind: ${plan.kind}`,
    ...(plan.command ? [`- run: ${plan.command}`] : []),
    ...(plan.instructions ? [`- ${plan.instructions}`] : []),
    `- required dependencies: ${plan.dependencies.join(", ") || "none"}`,
    "- adapt to your design tokens before keeping (reuse composition, not identity).",
  ];
  if (plan.licenseWarning) lines.push(`! ${plan.licenseWarning}`);
  return lines.join("\n");
}

export interface FetchPlanEntry {
  path: string;
  bytes: number;
  action: "create" | "overwrite" | "skip-exists" | "reject-unsafe-path";
}

export function formatArtifactHuman(artifact: ComponentArtifact, files?: FetchPlanEntry[]): string {
  const lines = [
    `${artifact.id} — ${artifact.files.length} file(s) from ${artifact.source.provider}`,
    `upstream: ${artifact.source.upstreamUrl}`,
    `retrieved: ${artifact.retrievedAt}`,
    `license: ${licenseLine(artifact.license)}${artifact.license.notes ? ` — ${artifact.license.notes}` : ""}`,
    `dependencies: ${artifact.dependencies.join(", ") || "none"}`,
    `registry dependencies: ${artifact.registryDependencies.join(", ") || "none"}`,
  ];
  if (artifact.installCommand) lines.push(`install: ${artifact.installCommand}`);
  lines.push("", "files:", ...artifact.files.map((f) => `  ${f.path} (${f.content.length} bytes)`));

  if (files) {
    lines.push("", "target:", ...files.map((f) => `  ${f.action.padEnd(18)} ${f.path}`));
    if (files.some((f) => f.action === "skip-exists")) {
      lines.push("", "Existing files were left untouched. Pass --force to overwrite.");
    }
  }

  if (artifact.license.redistribution === "restricted") {
    lines.push(
      "",
      "! This license permits use but restricts redistributing the source files.",
      "  Adapt it into your project; do not republish it as a component library.",
    );
  } else if (artifact.license.status === "unknown") {
    lines.push("", "! License is unknown. Verify upstream terms before reusing this source.");
  }

  lines.push(
    "",
    "Tessera wrote these files only because you asked. Nothing was installed or executed.",
  );
  return lines.join("\n");
}

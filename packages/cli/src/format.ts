import type { RankedResult } from "@tessera/core";
import type { TesseraComponent } from "@tessera/registry";

export function formatSearchHuman(results: RankedResult[]): string {
  if (results.length === 0) return "No results. Try broadening the query or removing filters.";
  return results
    .map((r, i) => {
      const c = r.component;
      const deps = c.dependencies.filter((d) => d.required).length;
      return [
        `${i + 1}. ${c.id} — ${c.name} (${r.score.toFixed(3)})`,
        `   category: ${c.category} | source: ${c.source} | frameworks: ${c.frameworks.join("/")}`,
        `   motion: ${c.visual.motion} | deps: ${deps} | license: ${c.license.status}${c.license.identifier ? ` (${c.license.identifier})` : ""}`,
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
    `license: ${c.license.status}${c.license.identifier ? ` (${c.license.identifier})` : ""}${c.license.notes ? ` — ${c.license.notes}` : ""}`,
    `links: ${
      Object.entries(c.links)
        .map(([k, v]) => `${k}=${v}`)
        .join(" ") || "—"
    }`,
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

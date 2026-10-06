import type { ComponentCategory, TesseraComponent } from "@tessera-dev/registry";
import { inferQueryIntent } from "./query.js";
import { scoreComponent } from "./score.js";

export const SUPPORTED_FRAMEWORKS = ["react", "vue", "svelte", "html", "other"] as const;
export const SUPPORTED_MOTIONS = ["none", "low", "medium", "high"] as const;

export interface SearchOptions {
  query: string;
  category?: string | undefined;
  framework?: string | undefined;
  source?: string | undefined;
  motion?: string | undefined;
  limit?: number | undefined;
}

export interface RankedResult {
  component: TesseraComponent;
  score: number;
  reasons: string[];
}

function fail(code: string, message: string): never {
  const err = new Error(message) as Error & { code: string };
  err.code = code;
  throw err;
}

function validateOptions(
  opts: SearchOptions,
): Required<Pick<SearchOptions, "limit">> & SearchOptions {
  const limit = opts.limit ?? 10;
  if (!Number.isInteger(limit) || limit < 1 || limit > 50)
    fail("invalid-limit", "limit must be an integer 1..50");
  if (opts.framework && !SUPPORTED_FRAMEWORKS.includes(opts.framework as never)) {
    fail("unsupported-framework", `unsupported framework "${opts.framework}"`);
  }
  if (opts.motion && ![...SUPPORTED_MOTIONS, "unknown"].includes(opts.motion as never)) {
    fail("unsupported-motion", `unsupported motion "${opts.motion}"`);
  }
  if (opts.query !== undefined && typeof opts.query !== "string")
    fail("invalid-query", "query must be a string");
  return { ...opts, limit };
}

export function searchRegistry(
  components: TesseraComponent[],
  opts: SearchOptions,
): RankedResult[] {
  const o = validateOptions(opts);
  if (components.length === 0) return [];
  const intent = inferQueryIntent(o.query ?? "");
  const effectiveCategory = (o.category ?? intent.category) as ComponentCategory | undefined;

  const filtered = components.filter((c) => {
    if (
      o.category &&
      c.category !== o.category &&
      !c.secondaryCategories.includes(o.category as never)
    )
      return false;
    if (o.framework && !c.frameworks.includes(o.framework as never)) return false;
    if (o.source && c.source !== o.source) return false;
    if (o.motion && c.visual.motion !== o.motion) return false;
    if (!o.framework && intent.framework && !c.frameworks.includes(intent.framework)) {
      // soft penalty handled in scoring; keep candidate unless hard mismatch on explicit filter
    }
    void effectiveCategory;
    return true;
  });

  const scored = filtered.map((c) => {
    const s = scoreComponent(
      c,
      { ...intent, category: effectiveCategory ?? intent.category },
      o.framework ? { framework: o.framework } : undefined,
    );
    return { component: c, score: s.score, reasons: s.reasons };
  });

  scored.sort((a, b) => b.score - a.score || (a.component.id < b.component.id ? -1 : 1));
  return scored.slice(0, o.limit);
}

export function getComponent(components: TesseraComponent[], id: string): TesseraComponent {
  const found = components.find((c) => c.id === id);
  if (!found) {
    fail("not-found", `unknown component id "${id}"`);
  }
  return found as TesseraComponent;
}

export function findSimilar(components: TesseraComponent[], id: string, limit = 5): RankedResult[] {
  if (!Number.isInteger(limit) || limit < 1 || limit > 50)
    fail("invalid-limit", "limit must be an integer 1..50");
  const target = getComponent(components, id);
  const targetTags = new Set(
    [...target.visual.aesthetics, ...target.visual.tags].map((t) => t.toLowerCase()),
  );
  const scored = components
    .filter((c) => c.id !== id)
    .map((c) => {
      let s = 0;
      const reasons: string[] = [];
      if (c.category === target.category) {
        s += 0.4;
        reasons.push(`same category: ${c.category}`);
      } else if (
        c.secondaryCategories.includes(target.category) ||
        target.secondaryCategories.includes(c.category)
      ) {
        s += 0.2;
        reasons.push("related category");
      }
      const overlap = [
        ...new Set([...c.visual.aesthetics, ...c.visual.tags].map((t) => t.toLowerCase())),
      ].filter((t) => targetTags.has(t));
      s += Math.min(0.3, overlap.length * 0.1);
      if (overlap.length > 0) reasons.push(`shared tags: ${overlap.slice(0, 3).join(", ")}`);
      if (c.visual.motion === target.visual.motion) {
        s += 0.1;
        reasons.push(`same motion level: ${c.visual.motion}`);
      }
      const sharedFw = c.frameworks.filter((f) => target.frameworks.includes(f));
      if (sharedFw.length > 0) {
        s += 0.1;
        reasons.push(`shared framework: ${sharedFw.join("/")}`);
      }
      const depDelta = Math.abs(c.dependencies.length - target.dependencies.length);
      s += Math.max(0, 0.1 - depDelta * 0.03);
      if (reasons.length === 0) reasons.push("loosely related");
      return { component: c, score: Math.round(s * 1000) / 1000, reasons };
    });
  scored.sort((a, b) => b.score - a.score || (a.component.id < b.component.id ? -1 : 1));
  return scored.slice(0, limit);
}

const PATTERN_SYNONYMS: Record<string, string> = {
  "developer tool hero with terminal and subtle grid":
    "dark technical terminal hero subtle motion developer cli",
  "saas pricing": "minimal saas pricing cards tiers",
  "grid background": "animated grid background subtle",
  "command menu": "developer command menu keyboard palette",
};

export function searchPatterns(
  components: TesseraComponent[],
  query: string,
  limit = 10,
): RankedResult[] {
  const expanded = PATTERN_SYNONYMS[query.toLowerCase().trim()] ?? query;
  const results = searchRegistry(components, { query: expanded, limit });
  return results.map((r) => ({
    ...r,
    reasons: [`pattern match for "${query}"`, ...r.reasons],
  }));
}

export function buildInstallationPlan(component: TesseraComponent): {
  id: string;
  kind: string;
  command?: string | undefined;
  instructions?: string | undefined;
  dependencies: string[];
  licenseWarning?: string | undefined;
} {
  return {
    id: component.id,
    kind: component.installation.kind,
    command: component.installation.command,
    instructions: component.installation.instructions,
    dependencies: component.dependencies.filter((d) => d.required).map((d) => d.name),
    licenseWarning:
      component.license.status === "unknown"
        ? "Unknown license: verify upstream terms before copying or vendoring this component."
        : undefined,
  };
}

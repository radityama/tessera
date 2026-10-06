import type { ComponentCategory, TesseraComponent } from "@tessera/registry";
import { CATEGORY_KEYWORDS, type QueryIntent } from "./query.js";

export interface ScoreBreakdown {
  relevance: number;
  stack: number;
  dependency: number;
  adaptability: number;
  accessibility: number;
  license: number;
}

export const WEIGHTS: ScoreBreakdown = {
  relevance: 0.35,
  stack: 0.2,
  dependency: 0.15,
  adaptability: 0.15,
  accessibility: 0.1,
  license: 0.05,
};

function textHaystack(c: TesseraComponent): string {
  return [c.name, c.description ?? "", c.category, ...c.secondaryCategories]
    .join(" ")
    .toLowerCase();
}

export function scoreRelevance(
  c: TesseraComponent,
  intent: QueryIntent,
): { value: number; hits: string[] } {
  if (intent.tokens.length === 0) return { value: 0.3, hits: [] };
  const hay = textHaystack(c);
  const tagSet = new Set([...c.visual.aesthetics, ...c.visual.tags].map((t) => t.toLowerCase()));
  let hits = 0;
  const matchedAesthetics: string[] = [];
  for (const tok of intent.tokens) {
    if (hay.includes(tok) || tagSet.has(tok)) {
      hits += 1;
      if ([...c.visual.aesthetics].map((a) => a.toLowerCase()).includes(tok))
        matchedAesthetics.push(tok);
    }
  }
  let value = hits / intent.tokens.length;
  if (
    intent.category &&
    (c.category === intent.category || c.secondaryCategories.includes(intent.category))
  ) {
    value = Math.min(1, value + 0.25);
  }
  // Bonus for additional category terms mentioned in the query (e.g. "terminal"
  // matching a secondary category). Keeps terminal-hero above grid-hero for
  // terminal-oriented queries without special-casing any source.
  const tokenSet = new Set(intent.tokens);
  let extraMatches = 0;
  for (const entry of CATEGORY_KEYWORDS) {
    if (entry.category === intent.category) continue;
    if (!entry.keys.some((k) => tokenSet.has(k))) continue;
    if (c.category === entry.category || c.secondaryCategories.includes(entry.category)) {
      extraMatches += 1;
    }
  }
  value = Math.min(1, value + Math.min(0.2, extraMatches * 0.1));
  // Motion alignment bonus: exact motion match outranks static fallbacks.
  if (intent.motion && c.visual.motion === intent.motion) value = Math.min(1, value + 0.08);
  return { value: Math.min(1, value), hits: matchedAesthetics };
}

export function scoreStack(
  c: TesseraComponent,
  intent: QueryIntent,
  explicitFramework?: string,
): { value: number; reason?: string } {
  const wanted = explicitFramework ?? intent.framework;
  if (!wanted && !intent.wantsNextjs) return { value: 0.7 };
  if (wanted && !c.frameworks.includes(wanted as never))
    return { value: 0.02, reason: "framework mismatch" };
  if (intent.wantsNextjs) {
    if (c.compatibility.nextjs) return { value: 1, reason: "React and Next.js compatible" };
    if (c.frameworks.includes("react")) return { value: 0.7, reason: "React compatible" };
    return { value: 0.2 };
  }
  return { value: 1, reason: `${c.frameworks.join("/")} compatible` };
}

export function scoreDependency(
  c: TesseraComponent,
  intent: QueryIntent,
): { value: number; required: number } {
  const required = c.dependencies.filter((d) => d.required).length;
  let value = 1 / (1 + required);
  const wantsMotion = intent.motion === "medium" || intent.motion === "high";
  const hasMotionLib = c.dependencies.some((d) => /framer-motion|motion|gsap/i.test(d.name));
  if (wantsMotion && hasMotionLib) value = Math.max(value, 0.6);
  return { value, required };
}

export function scoreAdaptability(c: TesseraComponent): number {
  const kindScore =
    c.installation.kind === "copy" || c.installation.kind === "manual"
      ? 1
      : c.installation.kind === "package" || c.installation.kind === "command"
        ? 0.7
        : 0.4;
  const required = c.dependencies.filter((d) => d.required).length;
  const depPenalty = Math.min(0.4, required * 0.1);
  return Math.max(0, Math.min(1, kindScore - depPenalty));
}

export function scoreAccessibility(c: TesseraComponent): number {
  let v = c.description ? 0.6 : 0.2;
  const tags = [...c.visual.tags, ...c.visual.aesthetics].map((t) => t.toLowerCase());
  if (tags.includes("accessible") || tags.includes("keyboard") || c.category === "form") v += 0.4;
  else if (c.category === "command-menu") v = Math.max(v, 0.8);
  return Math.min(1, v);
}

export function scoreLicense(c: TesseraComponent): number {
  return c.license.status === "known" ? 1 : 0.2;
}

export function scoreComponent(
  c: TesseraComponent,
  intent: QueryIntent,
  opts?: { framework?: string | undefined },
): { score: number; reasons: string[]; breakdown: ScoreBreakdown } {
  const rel = scoreRelevance(c, intent);
  const stack = scoreStack(c, intent, opts?.framework);
  const dep = scoreDependency(c, intent);
  const adapt = scoreAdaptability(c);
  const a11y = scoreAccessibility(c);
  const lic = scoreLicense(c);

  let score =
    rel.value * WEIGHTS.relevance +
    stack.value * WEIGHTS.stack +
    dep.value * WEIGHTS.dependency +
    adapt * WEIGHTS.adaptability +
    a11y * WEIGHTS.accessibility +
    lic * WEIGHTS.license;

  // Small deterministic intent-alignment bonuses (kept outside the capped
  // relevance dimension so richer matches are not hidden by the 1.0 cap).
  const tokenSet = new Set(intent.tokens);
  const mentioned = new Set<ComponentCategory>();
  for (const entry of CATEGORY_KEYWORDS) {
    if (entry.keys.some((k) => tokenSet.has(k))) mentioned.add(entry.category);
  }
  let bonus = 0;
  let secondaryHit: ComponentCategory | undefined;
  for (const cat of c.secondaryCategories) {
    if (mentioned.has(cat)) {
      secondaryHit = cat;
      break;
    }
  }
  if (secondaryHit) bonus += 0.05;
  if (intent.motion && c.visual.motion === intent.motion) bonus += 0.05;
  score += bonus;

  const reasons: string[] = [];
  if (
    intent.category &&
    (c.category === intent.category || c.secondaryCategories.includes(intent.category))
  ) {
    reasons.push(`exact category match: ${intent.category}`);
  }
  if (rel.hits.length > 0) reasons.push(`matches aesthetics: ${[...new Set(rel.hits)].join(", ")}`);
  else if (rel.value >= 0.4) reasons.push("matches query terms in name/description/tags");
  if (stack.reason) reasons.push(stack.reason);
  if (intent.motion && c.visual.motion === intent.motion) {
    reasons.push(`motion level matches requested ${intent.motion} motion`);
  } else if (intent.motion === "low" && c.visual.motion === "none") {
    reasons.push("static component fits requested subtle motion");
  }
  if (dep.required === 0) reasons.push("no required runtime dependencies");
  else if (dep.required === 1) reasons.push("one required runtime dependency");
  else reasons.push(`${dep.required} required runtime dependencies`);
  if (secondaryHit) reasons.push(`secondary match: ${secondaryHit}`);
  if (c.license.status === "known") {
    reasons.push(`known license${c.license.identifier ? ` (${c.license.identifier})` : ""}`);
  } else {
    reasons.push("unknown license — verify before vendoring");
  }
  if (reasons.length === 0) reasons.push("partial term overlap");

  return {
    score: Math.round(Math.min(1, Math.max(0, score)) * 1000) / 1000,
    reasons,
    breakdown: {
      relevance: rel.value,
      stack: stack.value,
      dependency: dep.value,
      adaptability: adapt,
      accessibility: a11y,
      license: lic,
    },
  };
}

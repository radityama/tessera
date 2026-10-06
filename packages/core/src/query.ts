import type { ComponentCategory } from "@tessera-dev/registry";

const STOPWORDS = new Set([
  "a",
  "an",
  "the",
  "for",
  "with",
  "and",
  "or",
  "of",
  "to",
  "in",
  "on",
  "is",
  "it",
  "its",
  "by",
  "from",
  "that",
  "this",
  "as",
  "at",
  "be",
  "are",
]);

export interface QueryIntent {
  raw: string;
  normalized: string;
  tokens: string[];
  category?: ComponentCategory | undefined;
  framework?: "react" | "vue" | "svelte" | "html" | "other" | undefined;
  wantsNextjs?: boolean | undefined;
  motion?: "none" | "low" | "medium" | "high" | undefined;
  aesthetics: string[];
  productContext: string[];
}

export const CATEGORY_KEYWORDS: Array<{ category: ComponentCategory; keys: string[] }> = [
  { category: "hero", keys: ["hero"] },
  { category: "navbar", keys: ["navbar"] },
  { category: "navigation", keys: ["navigation", "nav"] },
  { category: "pricing", keys: ["pricing", "price", "plans", "tiers"] },
  { category: "testimonial", keys: ["testimonial", "reviews", "social-proof"] },
  { category: "cta", keys: ["cta", "call-to-action"] },
  { category: "footer", keys: ["footer"] },
  { category: "background", keys: ["background", "grid", "aurora", "spotlight"] },
  { category: "form", keys: ["form", "login", "auth", "input"] },
  { category: "card", keys: ["card", "cards", "bento"] },
  { category: "table", keys: ["table"] },
  { category: "dashboard", keys: ["dashboard", "stats", "metrics", "admin"] },
  { category: "data-visualization", keys: ["chart", "visualization"] },
  { category: "command-menu", keys: ["command", "palette", "menu", "cmdk"] },
  { category: "terminal", keys: ["terminal", "cli", "console"] },
  { category: "animation", keys: ["animation", "animated", "motion", "reveal"] },
  { category: "pattern", keys: ["pattern"] },
  { category: "feature", keys: ["feature", "features", "bento"] },
];

const FRAMEWORK_KEYS: Record<string, QueryIntent["framework"]> = {
  react: "react",
  vue: "vue",
  svelte: "svelte",
  html: "html",
};

const MOTION_KEYS: Array<{ motion: NonNullable<QueryIntent["motion"]>; keys: string[] }> = [
  { motion: "none", keys: ["static", "no-motion", "still"] },
  { motion: "low", keys: ["subtle", "restrained", "minimal-motion", "subtle-motion", "gentle"] },
  { motion: "medium", keys: ["animated", "animate", "moderate"] },
  { motion: "high", keys: ["expressive", "intense", "dramatic"] },
];

const PRODUCT_KEYS: Array<{ ctx: string; keys: string[] }> = [
  { ctx: "developer", keys: ["developer", "devtool", "cli", "terminal", "docs"] },
  { ctx: "saas", keys: ["saas", "startup", "landing"] },
  { ctx: "commerce", keys: ["commerce", "shop", "store"] },
  { ctx: "dashboard", keys: ["dashboard", "admin", "metrics"] },
];

export function normalizeQuery(raw: string): string {
  return raw.toLowerCase().replace(/\s+/g, " ").trim();
}

export function tokenize(normalized: string): string[] {
  return normalized
    .split(/[^a-z0-9+.#]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

export function inferQueryIntent(raw: string): QueryIntent {
  const normalized = normalizeQuery(raw);
  const tokens = tokenize(normalized);
  const tokenSet = new Set(tokens);

  let category: QueryIntent["category"];
  for (const entry of CATEGORY_KEYWORDS) {
    if (entry.keys.some((k) => tokenSet.has(k))) {
      category = entry.category;
      break;
    }
  }

  let framework: QueryIntent["framework"];
  for (const [key, fw] of Object.entries(FRAMEWORK_KEYS)) {
    if (tokenSet.has(key)) framework = fw;
  }
  const wantsNextjs = tokenSet.has("nextjs") || tokenSet.has("next.js") || tokenSet.has("next");

  let motion: QueryIntent["motion"];
  for (const entry of MOTION_KEYS) {
    if (entry.keys.some((k) => normalized.includes(k))) {
      motion = entry.motion;
      break;
    }
  }
  if (!motion) {
    if (normalized.includes("subtle motion") || normalized.includes("subtle")) motion = "low";
    else if (normalized.includes("animated")) motion = "medium";
  }

  const KNOWN_AESTHETICS = new Set([
    "dark",
    "light",
    "technical",
    "minimal",
    "saas",
    "clean",
    "glass",
    "gradient",
    "expressive",
    "playful",
    "subtle",
    "developer",
    "terminal",
    "cli",
    "grid",
  ]);
  const aesthetics = tokens.filter((t) => KNOWN_AESTHETICS.has(t));

  const productContext: string[] = [];
  for (const entry of PRODUCT_KEYS) {
    if (entry.keys.some((k) => tokenSet.has(k))) productContext.push(entry.ctx);
  }

  return {
    raw,
    normalized,
    tokens,
    category,
    framework,
    wantsNextjs,
    motion,
    aesthetics,
    productContext,
  };
}

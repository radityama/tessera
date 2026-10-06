import type { ComponentCategory } from "@tessera-dev/registry";

/**
 * Deterministic classification of upstream components.
 *
 * Tessera cannot read a component's intent from its registry entry, so these
 * rules derive a best-effort category and visual profile from text the provider
 * actually publishes — the item name, its description, and (where present) its
 * own category list.
 *
 * Everything produced here is listed in `provenance.derivedFields`, so a
 * consumer can always tell an upstream fact from a Tessera inference. These
 * rules are deliberately simple and ordered: the first match wins, so the same
 * input always produces the same output.
 */

/**
 * Rules are ordered most-specific-first, and the first match wins. Order is
 * load-bearing: `magic-card` must resolve to `card` before the `background`
 * rule sees it, and `bento-grid` to `feature` before `background` claims it.
 */
const CATEGORY_RULES: Array<{ category: ComponentCategory; patterns: RegExp[] }> = [
  { category: "hero", patterns: [/\bhero\b/, /^hero-\d+$/] },
  { category: "navbar", patterns: [/\bnavbar\b/, /\bnav-bar\b/] },
  { category: "navigation", patterns: [/\bnavigation\b/, /^nav-/, /-nav\b/, /\btabs?\b/] },
  { category: "pricing", patterns: [/\bpricing\b/, /\bplans?\b/, /\btiers?\b/] },
  { category: "testimonial", patterns: [/\btestimonial/, /\breviews?\b/, /\bsocial[- ]proof\b/] },
  { category: "footer", patterns: [/\bfooter\b/] },
  { category: "cta", patterns: [/\bcta\b/, /\bcall[- ]to[- ]action\b/] },
  { category: "terminal", patterns: [/\bterminal\b/, /\bconsole\b/] },
  { category: "command-menu", patterns: [/\bcommand[- ]?(palette|menu)\b/, /\bcmdk\b/] },
  { category: "table", patterns: [/\btable\b/] },
  { category: "data-visualization", patterns: [/\bchart\b/, /\bgraph\b/, /\bsparkline\b/] },
  {
    category: "dashboard",
    patterns: [/\bdashboard\b/, /\bapp[- ]shell\b/, /\bstats?\b/, /\bmetrics?\b/, /\bkpi\b/],
  },
  {
    category: "form",
    patterns: [
      /\bform\b/,
      /\blogin\b/,
      /\bsign[- ]?in\b/,
      /\bsign[- ]?up\b/,
      /\bauth\b/,
      /\bcontact\b/,
    ],
  },
  { category: "feature", patterns: [/\bfeature/, /\bfaqs?\b/, /\bbento\b/] },
  { category: "card", patterns: [/\bcard\b/, /\btile\b/] },
  {
    category: "background",
    patterns: [
      /\bbackground\b/,
      /\bgrid\b/,
      /\baurora\b/,
      /\bspotlight\b/,
      /\bbeams?\b/,
      /\bstars?\b/,
      /\bpattern\b/,
      /\bwarp\b/,
      /\bmeteors?\b/,
      /\bparticles?\b/,
      /\bflicker/,
    ],
  },
  {
    category: "animation",
    patterns: [/\banimat/, /\bmarquee\b/, /\breveal\b/, /\btypewriter\b/, /\bticker\b/, /\btext\b/],
  },
];

function matchRules(text: string): ComponentCategory[] {
  const haystack = text.toLowerCase();
  const hits: ComponentCategory[] = [];
  for (const rule of CATEGORY_RULES) {
    if (rule.patterns.some((p) => p.test(haystack))) hits.push(rule.category);
  }
  return hits;
}

function mapUpstreamCategories(categories: string[]): ComponentCategory[] {
  const out: ComponentCategory[] = [];
  for (const raw of categories) {
    const mapped = UPSTREAM_CATEGORY_MAP[raw.toLowerCase().trim()];
    if (mapped) out.push(mapped);
  }
  return out;
}

/**
 * Classify a component from three signals, in descending order of trust:
 *
 * 1. the provider's own category list — an upstream fact;
 * 2. the component's name — what the provider calls it;
 * 3. its description — the weakest signal, because prose describes what is
 *    *inside* a component rather than what it is. "Modern sign-in page with
 *    particle background" is a form, not a background.
 *
 * Description is consulted only when the stronger signals are silent.
 */
export function inferCategory(
  name: string,
  description: string | undefined,
  upstreamCategories: string[],
): { category: ComponentCategory; secondary: ComponentCategory[] } {
  const fromUpstream = mapUpstreamCategories(upstreamCategories);
  const fromName = matchRules(name);
  const hits =
    fromUpstream.length > 0 || fromName.length > 0
      ? [...fromUpstream, ...fromName]
      : matchRules(description ?? "");

  const ordered = [...new Set(hits)];
  const category = ordered[0] ?? "other";
  return { category, secondary: ordered.slice(1, 3) };
}

/** Upstream category labels mapped onto Tessera's vocabulary. */
const UPSTREAM_CATEGORY_MAP: Record<string, ComponentCategory> = {
  hero: "hero",
  heroes: "hero",
  navbar: "navbar",
  navbars: "navbar",
  nav: "navigation",
  navigation: "navigation",
  pricing: "pricing",
  testimonial: "testimonial",
  testimonials: "testimonial",
  footer: "footer",
  footers: "footer",
  cta: "cta",
  background: "background",
  backgrounds: "background",
  form: "form",
  forms: "form",
  auth: "form",
  login: "form",
  contact: "form",
  table: "table",
  tables: "table",
  dashboard: "dashboard",
  "app-shell": "dashboard",
  chart: "data-visualization",
  card: "card",
  cards: "card",
  feature: "feature",
  features: "feature",
  faq: "feature",
  faqs: "feature",
  animation: "animation",
  text: "animation",
  terminal: "terminal",
  "command-menu": "command-menu",
  command: "command-menu",
};

const MOTION_DEPENDENCIES = /^(motion|framer-motion|gsap|lottie-react|@react-spring)/i;

/**
 * Motion is inferred only from a real signal: whether the component declares a
 * known animation dependency. Without that signal the level stays `unknown`
 * rather than being guessed.
 */
export function inferMotion(
  dependencies: string[],
): "none" | "low" | "medium" | "high" | "unknown" {
  return dependencies.some((d) => MOTION_DEPENDENCIES.test(d)) ? "medium" : "unknown";
}

const AESTHETIC_KEYWORDS = [
  "dark",
  "light",
  "minimal",
  "technical",
  "glass",
  "gradient",
  "retro",
  "playful",
  "clean",
  "bold",
  "elegant",
  "brutalist",
  "neon",
  "terminal",
  "developer",
] as const;

export function inferAesthetics(text: string): string[] {
  const hay = text.toLowerCase();
  return AESTHETIC_KEYWORDS.filter((k) => hay.includes(k));
}

/** Meaningful tokens from the upstream name, used as search tags. */
export function inferTags(name: string, description: string | undefined): string[] {
  const text = `${name} ${description ?? ""}`.toLowerCase();
  const tokens = text.split(/[^a-z0-9]+/).filter((t) => t.length > 2 && t.length < 24);
  return [...new Set(tokens)].slice(0, 24);
}

export const DERIVED_FIELDS = [
  "category",
  "secondaryCategories",
  "visual.aesthetics",
  "visual.tags",
  "visual.motion",
] as const;

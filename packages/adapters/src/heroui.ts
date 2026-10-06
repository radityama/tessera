import type { ComponentCategory, TesseraComponent } from "@tessera/registry";
import { toCanonical } from "./common.js";
import { getSource, type NpmSource } from "./sources.js";

/**
 * HeroUI is the one initial source that is not a copy-paste registry.
 *
 * It ships compiled primitives through npm and has no per-component registry
 * endpoint, so there is nothing to discover mechanically — the catalogue below
 * is curated, and every entry corresponds to a component HeroUI documents at
 * its own docs site. Each `docs` URL is checked by `pnpm registry:verify`.
 *
 * These are primitives, not page sections. Where a primitive has no equivalent
 * in Tessera's section-oriented vocabulary it is categorized `other` rather
 * than being forced into a slot that would misrepresent it.
 */

export interface HeroUiEntry {
  slug: string;
  name: string;
  description: string;
  category: ComponentCategory;
  tags: string[];
}

export const herouiComponents: HeroUiEntry[] = [
  {
    slug: "button",
    name: "Button",
    description: "Interactive button primitive with variants, sizes and loading state.",
    category: "other",
    tags: ["button", "action", "control", "interactive"],
  },
  {
    slug: "card",
    name: "Card",
    description: "Container primitive for grouped content with header, body and footer slots.",
    category: "card",
    tags: ["card", "container", "surface", "content"],
  },
  {
    slug: "navbar",
    name: "Navbar",
    description: "Responsive navigation bar with menu, brand and toggle slots.",
    category: "navbar",
    tags: ["navbar", "navigation", "header", "responsive"],
  },
  {
    slug: "form",
    name: "Form",
    description: "Form primitive with validation state, labels and submission handling.",
    category: "form",
    tags: ["form", "validation", "input", "accessible"],
  },
  {
    slug: "input",
    name: "Input",
    description: "Text input primitive with label, description and error messaging.",
    category: "form",
    tags: ["input", "field", "text", "form", "accessible"],
  },
  {
    slug: "table",
    name: "Table",
    description: "Data table primitive with sorting, selection and pagination support.",
    category: "table",
    tags: ["table", "data", "rows", "sorting"],
  },
  {
    slug: "modal",
    name: "Modal",
    description: "Accessible dialog primitive with focus management and backdrop.",
    category: "other",
    tags: ["modal", "dialog", "overlay", "accessible", "keyboard"],
  },
  {
    slug: "tabs",
    name: "Tabs",
    description: "Tabbed panel primitive with keyboard navigation.",
    category: "navigation",
    tags: ["tabs", "navigation", "keyboard", "panels"],
  },
  {
    slug: "accordion",
    name: "Accordion",
    description: "Collapsible disclosure primitive for grouped expandable content.",
    category: "other",
    tags: ["accordion", "collapse", "disclosure", "expandable", "faq"],
  },
  {
    slug: "chip",
    name: "Chip",
    description: "Compact status or label primitive with color variants.",
    category: "other",
    tags: ["chip", "badge", "label", "status", "tag"],
  },
  {
    slug: "pagination",
    name: "Pagination",
    description: "Page navigation primitive with sibling and boundary controls.",
    category: "navigation",
    tags: ["pagination", "navigation", "pages", "list"],
  },
  {
    slug: "skeleton",
    name: "Skeleton",
    description: "Loading placeholder primitive for content that has not resolved yet.",
    category: "other",
    tags: ["skeleton", "loading", "placeholder", "async"],
  },
];

export function buildHeroUiComponent(entry: HeroUiEntry, retrievedAt: string): TesseraComponent {
  const source = getSource("heroui") as NpmSource;
  return toCanonical({
    schemaVersion: 2,
    id: `heroui/${entry.slug}`,
    source: "heroui",
    slug: entry.slug,
    name: entry.name,
    description: entry.description,
    category: entry.category,
    secondaryCategories: [],
    frameworks: source.frameworks,
    compatibility: source.compatibility,
    visual: {
      aesthetics: ["minimal", "clean"],
      tags: entry.tags,
      motion: "low",
      density: "normal",
      radius: "medium",
      surface: ["flat"],
    },
    dependencies: [{ name: source.package, kind: "runtime", required: true }],
    installation: {
      kind: "package",
      command: source.installCommand,
      instructions: `Install ${source.package}, then compose the ${entry.name} primitive into your page and adapt it to your design tokens.`,
    },
    retrieval: {
      kind: "npm-package",
      package: source.package,
      importHint: source.importHint,
    },
    links: {
      homepage: source.homepage,
      docs: `${source.docs}/components/${entry.slug}`,
    },
    license: source.license,
    provenance: {
      adapter: "heroui-curated",
      upstreamName: entry.slug,
      retrievedAt,
      sourceVersion: source.package,
      derivedFields: [],
    },
  });
}

export const herouiAdapter = {
  id: "heroui",
  parse(input: unknown): TesseraComponent[] {
    const retrievedAt = new Date().toISOString();
    if (Array.isArray(input)) {
      return input.map((entry) => buildHeroUiComponent(entry as HeroUiEntry, retrievedAt));
    }
    return herouiComponents.map((entry) => buildHeroUiComponent(entry, retrievedAt));
  },
};

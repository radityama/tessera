import { z } from "zod";
import { depList, normList, slugify, toCanonical, type RegistryAdapter } from "./common.js";

const AceternityRaw = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  tagline: z.string().optional(),
  tags: z.array(z.string()).optional(),
  demo: z.string().url().optional(),
  needsClientComponent: z.boolean().optional(),
});

function mapCategory(
  tags: string[],
): "hero" | "background" | "card" | "navbar" | "animation" | "other" {
  if (tags.includes("hero")) return "hero";
  if (tags.includes("background") || tags.includes("grid")) return "background";
  if (tags.includes("card")) return "card";
  if (tags.includes("navbar") || tags.includes("navigation")) return "navbar";
  if (tags.includes("animation") || tags.includes("text")) return "animation";
  return "other";
}

export const aceternityAdapter: RegistryAdapter<unknown> = {
  id: "aceternity",
  parse(input: unknown) {
    const raws = Array.isArray(input) ? input : [input];
    return raws.map((item) => {
      const r = AceternityRaw.parse(item);
      const tags = normList(r.tags);
      const slug = slugify(r.slug);
      return toCanonical({
        schemaVersion: 1,
        id: `aceternity/${slug}`,
        source: "aceternity",
        slug,
        name: r.name,
        description: r.tagline,
        category: mapCategory(tags),
        secondaryCategories: [],
        frameworks: ["react"],
        compatibility: {
          nextjs: true,
          clientComponent: r.needsClientComponent ?? true,
          typescript: true,
        },
        visual: {
          aesthetics: tags.slice(0, 3),
          tags,
          motion: tags.includes("animated") ? "medium" : "low",
          density: "normal",
          radius: "medium",
          surface: ["flat"],
        },
        dependencies: depList(["framer-motion"]),
        installation: { kind: "copy", instructions: "Copy the component from Aceternity UI docs." },
        links: { homepage: "https://ui.aceternity.com/", docs: r.demo },
        license: {
          status: "known",
          identifier: "MIT",
          source: "https://ui.aceternity.com/license",
        },
        provenance: { adapter: "aceternity" },
      });
    });
  },
};

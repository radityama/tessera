import { z } from "zod";
import { normList, slugify, toCanonical, type RegistryAdapter } from "./common.js";

const HeroRaw = z.object({
  component: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  docsUrl: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
  needsPackage: z.boolean().optional(),
});

function mapCategory(tags: string[]) {
  if (tags.includes("hero")) return "hero" as const;
  if (tags.includes("pricing")) return "pricing" as const;
  if (tags.includes("testimonial")) return "testimonial" as const;
  if (tags.includes("form") || tags.includes("auth")) return "form" as const;
  return "other" as const;
}

export const herouiAdapter: RegistryAdapter<unknown> = {
  id: "heroui",
  parse(input: unknown) {
    const raws = Array.isArray(input) ? input : [input];
    return raws.map((item) => {
      const r = HeroRaw.parse(item);
      const tags = normList(r.tags);
      const slug = slugify(r.slug);
      return toCanonical({
        schemaVersion: 1,
        id: `heroui/${slug}`,
        source: "heroui",
        slug,
        name: r.component,
        description: r.description,
        category: mapCategory(tags),
        secondaryCategories: [],
        frameworks: ["react"],
        compatibility: { nextjs: true, typescript: true },
        visual: {
          aesthetics: ["minimal", "saas"],
          tags,
          motion: "none",
          density: "normal",
          radius: "medium",
          surface: ["outlined"],
        },
        dependencies:
          r.needsPackage === false
            ? []
            : [{ name: "@heroui/react", kind: "runtime" as const, required: true }],
        installation: {
          kind: "package",
          command: "npm install @heroui/react",
          instructions: "Install HeroUI, then compose from primitives.",
        },
        links: { homepage: "https://www.heroui.com/", docs: r.docsUrl },
        license: {
          status: "known",
          identifier: "MIT",
          source: "https://github.com/heroui-inc/heroui/blob/canary/LICENSE",
        },
        provenance: { adapter: "heroui" },
      });
    });
  },
};

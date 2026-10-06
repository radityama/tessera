import { z } from "zod";
import { depList, normList, slugify, toCanonical, type RegistryAdapter } from "./common.js";

const BeuiRaw = z.object({
  title: z.string().min(1),
  id: z.string().min(1),
  desc: z.string().optional(),
  kind: z.string().optional(),
  theme: z.array(z.string()).optional(),
  install: z.string().optional(),
  href: z.string().url().optional(),
});

function mapCategory(kind: string | undefined) {
  switch ((kind ?? "").toLowerCase()) {
    case "hero":
      return "hero" as const;
    case "cta":
      return "cta" as const;
    case "footer":
      return "footer" as const;
    case "table":
      return "table" as const;
    default:
      return "other" as const;
  }
}

export const beuiAdapter: RegistryAdapter<unknown> = {
  id: "beui",
  parse(input: unknown) {
    const raws = Array.isArray(input) ? input : [input];
    return raws.map((item) => {
      const r = BeuiRaw.parse(item);
      const slug = slugify(r.id);
      const tags = normList(r.theme);
      return toCanonical({
        schemaVersion: 1,
        id: `beui/${slug}`,
        source: "beui",
        slug,
        name: r.title,
        description: r.desc,
        category: mapCategory(r.kind),
        secondaryCategories: [],
        frameworks: ["react"],
        compatibility: { nextjs: true, typescript: true },
        visual: {
          aesthetics: tags.slice(0, 3),
          tags,
          motion: "none",
          density: "normal",
          radius: "small",
          surface: ["flat"],
        },
        dependencies: depList([]),
        installation: r.install
          ? { kind: "package", command: r.install }
          : { kind: "copy", instructions: "Copy the section from BeUI docs." },
        links: { homepage: "https://beui.example.com/", docs: r.href },
        license: {
          status: "known",
          identifier: "Apache-2.0",
          source: "https://beui.example.com/license",
        },
        provenance: { adapter: "beui" },
      });
    });
  },
};

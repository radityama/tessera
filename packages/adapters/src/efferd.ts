import { z } from "zod";
import { depList, normList, slugify, toCanonical, type RegistryAdapter } from "./common.js";

const EfferdRaw = z.object({
  label: z.string().min(1),
  slug: z.string().min(1),
  blurb: z.string().optional(),
  tags: z.array(z.string()).optional(),
  license: z.string().nullable().optional(),
  licenseUrl: z.string().url().optional(),
  href: z.string().url().optional(),
  categoryHint: z.string().optional(),
});

function mapCategory(hint: string | undefined, tags: string[]) {
  const h = (hint ?? "").toLowerCase();
  if (h.includes("terminal") || tags.includes("terminal")) return "terminal" as const;
  if (h.includes("dashboard") || tags.includes("dashboard")) return "dashboard" as const;
  if (h.includes("background") || tags.includes("background")) return "background" as const;
  if (h.includes("feature") || tags.includes("feature")) return "feature" as const;
  return "other" as const;
}

export const efferdAdapter: RegistryAdapter<unknown> = {
  id: "efferd",
  parse(input: unknown) {
    const raws = Array.isArray(input) ? input : [input];
    return raws.map((item) => {
      const r = EfferdRaw.parse(item);
      const tags = normList(r.tags);
      const slug = slugify(r.slug);
      const licenseKnown = typeof r.license === "string" && r.license.length > 0;
      return toCanonical({
        schemaVersion: 1,
        id: `efferd/${slug}`,
        source: "efferd",
        slug,
        name: r.label,
        description: r.blurb,
        category: mapCategory(r.categoryHint, tags),
        secondaryCategories: [],
        frameworks: ["react"],
        compatibility: { nextjs: true, typescript: true },
        visual: {
          aesthetics: tags.slice(0, 3),
          tags,
          motion: "unknown",
          density: "normal",
          radius: "small",
          surface: ["flat"],
        },
        dependencies: depList([]),
        installation: { kind: "copy", instructions: "Copy the snippet from Efferd." },
        links: { homepage: "https://efferd.example.com/", docs: r.href },
        license: licenseKnown
          ? { status: "known", identifier: r.license as string, source: r.licenseUrl }
          : {
              status: "unknown",
              notes: "Upstream license not confirmed; do not vendor without checking.",
            },
        provenance: { adapter: "efferd" },
      });
    });
  },
};

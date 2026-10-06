import { z } from "zod";
import { depList, normList, slugify, toCanonical, type RegistryAdapter } from "./common.js";

const BeautifulRaw = z.object({
  block: z.string().min(1),
  slug: z.string().min(1),
  summary: z.string().optional(),
  aesthetics: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  motion: z.enum(["none", "low", "medium", "high"]).optional(),
  deps: z.array(z.string()).optional(),
  url: z.string().url().optional(),
  categoryHint: z.string().optional(),
});

function mapCategory(hint: string | undefined, tags: string[]) {
  const h = (hint ?? "").toLowerCase();
  if (h.includes("hero") || tags.includes("hero")) return "hero" as const;
  if (h.includes("command") || tags.includes("command")) return "command-menu" as const;
  if (h.includes("pricing") || tags.includes("pricing")) return "pricing" as const;
  if (h.includes("feature") || tags.includes("bento")) return "feature" as const;
  if (h.includes("nav")) return "navigation" as const;
  return "other" as const;
}

export const beautifuluiAdapter: RegistryAdapter<unknown> = {
  id: "beautifului",
  parse(input: unknown) {
    const raws = Array.isArray(input) ? input : [input];
    return raws.map((item) => {
      const r = BeautifulRaw.parse(item);
      const tags = normList([...(r.tags ?? []), ...(r.aesthetics ?? [])]);
      const slug = slugify(r.slug);
      return toCanonical({
        schemaVersion: 1,
        id: `beautifului/${slug}`,
        source: "beautifului",
        slug,
        name: r.block,
        description: r.summary,
        category: mapCategory(r.categoryHint, tags),
        secondaryCategories: [],
        frameworks: ["react"],
        compatibility: { nextjs: true, typescript: true },
        visual: {
          aesthetics: normList(r.aesthetics),
          tags,
          motion: r.motion ?? "unknown",
          density: "normal",
          radius: "medium",
          surface: ["flat"],
        },
        dependencies: depList(r.deps ?? []),
        installation:
          (r.deps ?? []).length > 0
            ? { kind: "package", command: `npm install ${(r.deps ?? []).join(" ")}` }
            : { kind: "copy", instructions: "Copy the block from Beautiful UI." },
        links: { homepage: "https://beautifului.example.com/", docs: r.url },
        license: {
          status: "known",
          identifier: "MIT",
          source: "https://beautifului.example.com/license",
        },
        provenance: { adapter: "beautifului" },
      });
    });
  },
};

import { describe, expect, it } from "vitest";
import { LicenseSchema, TesseraComponentSchema } from "@tessera-dev/registry";
import { npmPackageName, slugify } from "./common.js";
import { inferCategory } from "./classify.js";
import { normalizeShadcnItem, resolveItemLicense } from "./shadcn.js";
import { sources, getSource, shadcnSources } from "./sources.js";
import { buildHeroUiComponent, herouiComponents } from "./heroui.js";

const RETRIEVED_AT = "2026-10-06T00:00:00.000Z";

/** A registry item shaped like the ones Aceternity, beUI, Efferd and Magic UI publish. */
const fixtureItem = {
  name: "terminal",
  type: "registry:ui",
  title: "Terminal",
  description: "A dark terminal window with subtle motion for developer landing pages.",
  dependencies: ["motion"],
  registryDependencies: ["utils"],
  files: [
    {
      path: "components/ui/terminal.tsx",
      type: "registry:ui",
      content: "export function Terminal() { return null }",
    },
  ],
};

describe("npmPackageName", () => {
  it("strips versions from plain packages", () => {
    expect(npmPackageName("framer-motion@11.0.0")).toBe("framer-motion");
    expect(npmPackageName("motion")).toBe("motion");
  });

  it("preserves scoped package names", () => {
    expect(npmPackageName("@heroui/react")).toBe("@heroui/react");
    expect(npmPackageName("@heroui/react@3.2.6")).toBe("@heroui/react");
    expect(npmPackageName("@radix-ui/react-dialog@^1.0.0")).toBe("@radix-ui/react-dialog");
  });
});

describe("slugify", () => {
  it("produces canonical kebab-case slugs", () => {
    expect(slugify("Hero Parallax")).toBe("hero-parallax");
    expect(slugify("hero_1")).toBe("hero-1");
    expect(slugify("  Bento   Grid  ")).toBe("bento-grid");
  });
});

describe("inferCategory", () => {
  it("classifies section names deterministically", () => {
    expect(inferCategory("hero-1", undefined, []).category).toBe("hero");
    expect(inferCategory("floating-navbar", undefined, []).category).toBe("navbar");
    expect(inferCategory("terminal", undefined, []).category).toBe("terminal");
    expect(inferCategory("command-palette", undefined, []).category).toBe("command-menu");
    expect(inferCategory("warp-background", undefined, []).category).toBe("background");
  });

  it("uses the provider's own category list when present", () => {
    expect(inferCategory("something", undefined, ["pricing"]).category).toBe("pricing");
  });

  it("falls back to other rather than guessing", () => {
    expect(inferCategory("zzz", undefined, []).category).toBe("other");
  });
});

describe("source descriptors", () => {
  it("every source declares a schema-valid license", () => {
    for (const source of sources) {
      const parsed = LicenseSchema.safeParse(source.license);
      expect(parsed.success, `${source.id} license invalid`).toBe(true);
    }
  });

  it("known licenses always carry an evidence URL", () => {
    for (const source of sources) {
      if (source.license.status === "known") {
        expect(source.license.source, `${source.id} missing evidence`).toBeTruthy();
        expect(source.license.identifier, `${source.id} missing identifier`).toBeTruthy();
      }
    }
  });

  it("uses no placeholder domains anywhere in the descriptors", () => {
    const serialized = JSON.stringify(sources);
    expect(serialized).not.toMatch(/example\.com|localhost|\.invalid/i);
  });

  it("does not describe Aceternity as an OSI-approved license", () => {
    const aceternity = getSource("aceternity");
    expect(aceternity.license.identifier).not.toBe("MIT");
    expect(aceternity.license.osiApproved).toBe(false);
    expect(aceternity.license.redistribution).toBe("restricted");
  });
});

describe("normalizeShadcnItem", () => {
  const source = getSource("magicui");
  if (source.kind !== "shadcn-registry") throw new Error("magicui must be a shadcn source");

  it("emits a canonical v2 record carrying real retrieval metadata", () => {
    const component = normalizeShadcnItem(source, fixtureItem, { retrievedAt: RETRIEVED_AT });
    expect(TesseraComponentSchema.safeParse(component).success).toBe(true);
    expect(component.schemaVersion).toBe(2);
    expect(component.id).toBe("magicui/terminal");
    expect(component.retrieval.kind).toBe("shadcn-registry");
    if (component.retrieval.kind === "shadcn-registry") {
      expect(component.retrieval.itemUrl).toBe("https://magicui.design/r/terminal.json");
    }
  });

  it("preserves upstream facts and declares what it inferred", () => {
    const component = normalizeShadcnItem(source, fixtureItem, { retrievedAt: RETRIEVED_AT });
    expect(component.description).toBe(fixtureItem.description);
    expect(component.dependencies.map((d) => d.name)).toEqual(["motion"]);
    expect(component.provenance.upstreamName).toBe("terminal");
    expect(component.provenance.retrievedAt).toBe(RETRIEVED_AT);
    expect(component.provenance.derivedFields).toContain("category");
  });

  it("rejects an upstream item with no files instead of emitting an empty component", () => {
    expect(() =>
      normalizeShadcnItem(source, { ...fixtureItem, files: [] }, { retrievedAt: RETRIEVED_AT }),
    ).toThrow();
  });

  it("omits a description rather than inventing one", () => {
    const { description: _drop, ...withoutDescription } = fixtureItem;
    const component = normalizeShadcnItem(source, withoutDescription, {
      retrievedAt: RETRIEVED_AT,
    });
    expect(component.description).toBeUndefined();
  });
});

describe("resolveItemLicense", () => {
  const efferd = getSource("efferd");
  if (efferd.kind !== "shadcn-registry") throw new Error("efferd must be a shadcn source");

  it("keeps the source license for items present in the open-source repository", () => {
    expect(resolveItemLicense(efferd, "hero-1", new Set(["hero-1"]))).toBeUndefined();
  });

  it("downgrades items that exist only in the paid hosted catalogue", () => {
    const override = resolveItemLicense(efferd, "app-shell-1", new Set(["hero-1"]));
    expect(override?.status).toBe("unknown");
    expect(override?.identifier).toBeUndefined();
    expect(override?.notes).toMatch(/open-source repository/i);
  });

  it("needs no override when the repository list is unavailable", () => {
    expect(resolveItemLicense(efferd, "hero-1", undefined)).toBeUndefined();
  });
});

describe("heroui curated components", () => {
  it("all produce valid canonical records", () => {
    for (const entry of herouiComponents) {
      const component = buildHeroUiComponent(entry, RETRIEVED_AT);
      const parsed = TesseraComponentSchema.safeParse(component);
      expect(parsed.success, `${entry.slug} invalid`).toBe(true);
    }
  });

  it("retrieves through npm rather than a registry URL", () => {
    const component = buildHeroUiComponent(herouiComponents[0]!, RETRIEVED_AT);
    expect(component.retrieval).toEqual({
      kind: "npm-package",
      package: "@heroui/react",
      importHint: expect.stringContaining("@heroui/react"),
    });
  });

  it("points every component at its real HeroUI documentation page", () => {
    for (const entry of herouiComponents) {
      const component = buildHeroUiComponent(entry, RETRIEVED_AT);
      expect(component.links.docs).toBe(`https://www.heroui.com/docs/components/${entry.slug}`);
    }
  });

  it("keeps slugs unique", () => {
    const slugs = herouiComponents.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe("shadcnSources", () => {
  it("returns only registry-backed sources", () => {
    const ids = shadcnSources().map((s) => s.id);
    expect(ids).toEqual(["aceternity", "beui", "efferd", "magicui"]);
    expect(ids).not.toContain("heroui");
  });
});

import { describe, expect, it } from "vitest";
import { TesseraComponentSchema } from "@tessera/registry";
import { adapters, normalizeWithAdapter } from "./index.js";

describe("adapters", () => {
  it("exposes five adapters", () => {
    expect(Object.keys(adapters).sort()).toEqual(
      ["aceternity", "beautifului", "beui", "efferd", "heroui"].sort(),
    );
  });

  it("aceternity normalizes to canonical schema", () => {
    const out = normalizeWithAdapter("aceternity", {
      name: "Spotlight Hero",
      slug: "spotlight-hero",
      tagline: "Dark hero",
      tags: ["hero", "dark", "technical"],
      demo: "https://ui.aceternity.com/components/spotlight",
    });
    expect(out).toHaveLength(1);
    expect(out[0]?.id).toBe("aceternity/spotlight-hero");
    expect(out[0]?.category).toBe("hero");
    expect(out[0]?.links.homepage).toContain("aceternity");
    expect(TesseraComponentSchema.safeParse(out[0]).success).toBe(true);
  });

  it("beautifului maps dependency metadata and install command", () => {
    const out = normalizeWithAdapter("beautifului", {
      block: "Command Palette",
      slug: "command-palette",
      tags: ["command", "developer"],
      deps: ["cmdk"],
      categoryHint: "command-menu",
    });
    expect(out[0]?.category).toBe("command-menu");
    expect(out[0]?.dependencies.map((d) => d.name)).toContain("cmdk");
    expect(out[0]?.installation.command).toContain("cmdk");
  });

  it("beui preserves source url and maps category", () => {
    const out = normalizeWithAdapter("beui", {
      title: "Data Table",
      id: "data-table",
      kind: "table",
      theme: ["technical", "dense"],
      href: "https://beui.example.com/table",
    });
    expect(out[0]?.id).toBe("beui/data-table");
    expect(out[0]?.category).toBe("table");
    expect(out[0]?.links.docs).toBe("https://beui.example.com/table");
  });

  it("heroui maps hero/pricing/form categories", () => {
    const hero = normalizeWithAdapter("heroui", {
      component: "Centered Hero",
      slug: "hero-centered",
      tags: ["hero", "saas"],
    });
    expect(hero[0]?.category).toBe("hero");
    const form = normalizeWithAdapter("heroui", {
      component: "Login",
      slug: "login",
      tags: ["form", "auth"],
    });
    expect(form[0]?.category).toBe("form");
  });

  it("efferd preserves explicit license and marks unknown otherwise", () => {
    const known = normalizeWithAdapter("efferd", {
      label: "Aurora",
      slug: "aurora",
      license: "MIT",
      licenseUrl: "https://efferd.example.com/license",
      tags: ["background"],
    });
    expect(known[0]?.license.status).toBe("known");
    const unknown = normalizeWithAdapter("efferd", {
      label: "Terminal",
      slug: "terminal",
      tags: ["terminal"],
    });
    expect(unknown[0]?.license.status).toBe("unknown");
    expect(unknown[0]?.license.identifier).toBeUndefined();
  });

  it("rejects malformed source metadata instead of emitting invalid records", () => {
    expect(() => normalizeWithAdapter("aceternity", { nope: true })).toThrow();
    expect(() => normalizeWithAdapter("beui", { title: "", id: "" })).toThrow();
  });

  it("all adapter outputs pass canonical validation", () => {
    const samples: Array<[keyof typeof adapters, unknown]> = [
      ["aceternity", { name: "A", slug: "a", tags: ["card"] }],
      ["beautifului", { block: "B", slug: "b" }],
      ["beui", { title: "C", id: "c", kind: "hero" }],
      ["heroui", { component: "D", slug: "d" }],
      ["efferd", { label: "E", slug: "e" }],
    ];
    for (const [id, input] of samples) {
      const out = normalizeWithAdapter(id, input);
      expect(TesseraComponentSchema.safeParse(out[0]).success).toBe(true);
    }
  });
});

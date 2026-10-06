import { describe, expect, it } from "vitest";
import { TesseraComponentSchema } from "./schema.js";

const base = {
  schemaVersion: 1,
  id: "beautifului/terminal-hero",
  source: "beautifului",
  slug: "terminal-hero",
  name: "Terminal Hero",
  category: "hero",
  secondaryCategories: [],
  frameworks: ["react"],
  compatibility: {},
  visual: {},
  dependencies: [],
  installation: { kind: "copy", instructions: "Copy it." },
  links: {},
  license: { status: "known", identifier: "MIT", source: "https://example.com/license" },
  provenance: { adapter: "beautifului" },
};

describe("TesseraComponentSchema", () => {
  it("accepts a minimal valid component", () => {
    expect(TesseraComponentSchema.safeParse(base).success).toBe(true);
  });

  it("rejects mismatched id", () => {
    const r = TesseraComponentSchema.safeParse({ ...base, id: "other/slug" });
    expect(r.success).toBe(false);
  });

  it("rejects invalid schema version", () => {
    const r = TesseraComponentSchema.safeParse({ ...base, schemaVersion: 2 });
    expect(r.success).toBe(false);
  });

  it("rejects unknown category", () => {
    const r = TesseraComponentSchema.safeParse({ ...base, category: "spaceship" });
    expect(r.success).toBe(false);
  });

  it("treats unknown license as valid but distinct from permissive", () => {
    const r = TesseraComponentSchema.safeParse({
      ...base,
      license: { status: "unknown", notes: "not confirmed" },
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.license.status).toBe("unknown");
  });

  it("rejects unknown license carrying an identifier", () => {
    const r = TesseraComponentSchema.safeParse({
      ...base,
      license: { status: "unknown", identifier: "MIT" },
    });
    expect(r.success).toBe(false);
  });

  it("rejects missing installation", () => {
    const { installation: _installation, ...rest } = base;
    expect(_installation).toBeDefined();
    expect(TesseraComponentSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects unsupported framework", () => {
    const r = TesseraComponentSchema.safeParse({ ...base, frameworks: ["cobol"] });
    expect(r.success).toBe(false);
  });
});

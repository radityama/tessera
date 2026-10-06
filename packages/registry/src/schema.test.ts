import { describe, expect, it } from "vitest";
import { SCHEMA_VERSION, TesseraComponentSchema } from "./schema.js";

/**
 * Fixtures deliberately use example.com: these are synthetic records, not
 * published registry data. The release guard that forbids placeholder domains
 * scans `registries/` only.
 */
const base = {
  schemaVersion: SCHEMA_VERSION,
  id: "example-source/terminal-hero",
  source: "example-source",
  slug: "terminal-hero",
  name: "Terminal Hero",
  category: "hero",
  secondaryCategories: [],
  frameworks: ["react"],
  compatibility: {},
  visual: {},
  dependencies: [],
  installation: { kind: "copy", instructions: "Copy it." },
  retrieval: { kind: "shadcn-registry", itemUrl: "https://example.com/r/terminal-hero.json" },
  links: {},
  license: { status: "known", identifier: "MIT", source: "https://example.com/LICENSE" },
  provenance: { adapter: "example-source" },
};

describe("TesseraComponentSchema", () => {
  it("accepts a minimal valid component", () => {
    expect(TesseraComponentSchema.safeParse(base).success).toBe(true);
  });

  it("rejects mismatched id", () => {
    expect(TesseraComponentSchema.safeParse({ ...base, id: "other/slug" }).success).toBe(false);
  });

  it("rejects a schema version this build does not support", () => {
    expect(TesseraComponentSchema.safeParse({ ...base, schemaVersion: 1 }).success).toBe(false);
    expect(TesseraComponentSchema.safeParse({ ...base, schemaVersion: 3 }).success).toBe(false);
  });

  it("rejects unknown category", () => {
    expect(TesseraComponentSchema.safeParse({ ...base, category: "spaceship" }).success).toBe(
      false,
    );
  });

  it("requires retrieval metadata so every record says where it comes from", () => {
    const { retrieval: _drop, ...withoutRetrieval } = base;
    expect(TesseraComponentSchema.safeParse(withoutRetrieval).success).toBe(false);
  });

  it("rejects unknown retrieval kinds rather than guessing", () => {
    expect(
      TesseraComponentSchema.safeParse({ ...base, retrieval: { kind: "telepathy" } }).success,
    ).toBe(false);
  });

  it("requires an evidence URL for a known license", () => {
    const r = TesseraComponentSchema.safeParse({
      ...base,
      license: { status: "known", identifier: "MIT" },
    });
    expect(r.success).toBe(false);
  });

  it("requires an identifier for a known license", () => {
    const r = TesseraComponentSchema.safeParse({
      ...base,
      license: { status: "known", source: "https://example.com/LICENSE" },
    });
    expect(r.success).toBe(false);
  });

  it("rejects a non-URL license source", () => {
    const r = TesseraComponentSchema.safeParse({
      ...base,
      license: { status: "known", identifier: "MIT", source: "trust me" },
    });
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
    expect(
      TesseraComponentSchema.safeParse({
        ...base,
        license: { status: "unknown", identifier: "MIT" },
      }).success,
    ).toBe(false);
  });

  it("rejects a non-URL retrieval target", () => {
    expect(
      TesseraComponentSchema.safeParse({
        ...base,
        retrieval: { kind: "shadcn-registry", itemUrl: "/local/path.json" },
      }).success,
    ).toBe(false);
  });

  it("allows a metadata-only component with no retrievable artifact", () => {
    expect(TesseraComponentSchema.safeParse({ ...base, retrieval: { kind: "none" } }).success).toBe(
      true,
    );
  });

  it("rejects missing installation", () => {
    const { installation: _drop, ...rest } = base;
    expect(TesseraComponentSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects unsupported framework", () => {
    expect(TesseraComponentSchema.safeParse({ ...base, frameworks: ["cobol"] }).success).toBe(
      false,
    );
  });
});

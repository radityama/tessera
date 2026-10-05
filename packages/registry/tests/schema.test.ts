import { describe, expect, it } from "vitest";
import {
  componentSchema,
  createComponentId,
  parseRegistry,
  registrySchema,
  RegistryError,
} from "../src/index.js";
import { component, snapshot } from "./fixtures.js";

describe("canonical component", () => {
  it("preserves explicit unknown metadata without adding inferred facts", () => {
    expect(componentSchema.parse(component())).toEqual(component());
  });

  it("defaults missing dependency knowledge to unknown, including empty lists", () => {
    const input = Object.fromEntries(
      Object.entries(component()).filter(([key]) => key !== "dependencyStatus"),
    );
    expect(componentSchema.parse(input).dependencyStatus).toBe("unknown");
    expect(
      componentSchema.parse({
        ...input,
        dependencies: [{ name: "react", kind: "peer", required: true }],
      }).dependencyStatus,
    ).toBe("unknown");
  });

  it("preserves explicitly verified dependency knowledge and rejects unsupported statuses", () => {
    expect(
      componentSchema.parse({ ...component(), dependencyStatus: "known" })
        .dependencyStatus,
    ).toBe("known");
    expect(
      componentSchema.safeParse({
        ...component(),
        dependencyStatus: "complete",
      }).success,
    ).toBe(false);
  });

  it("preserves the complete canonical model", () => {
    const complete = {
      ...component(),
      description: "A reviewed terminal display",
      compatibility: { nextjs: true, clientComponent: true, typescript: true },
      visual: {
        aesthetics: ["technical"],
        tags: ["cli"],
        motion: "low",
        density: "compact",
        radius: "small",
        surface: ["outlined"],
      },
      dependencies: [{ name: "react", kind: "peer", required: true }],
      installation: {
        kind: "command",
        command: "npm install fixture",
        instructions: "Review first",
      },
      links: {
        homepage: "https://example.com",
        docs: "https://example.com/docs",
        preview: "http://example.com/preview",
        source: "https://example.com/source",
      },
      license: {
        status: "known",
        identifier: "MIT",
        source: "https://example.com/license",
        notes: "Verified evidence",
      },
      provenance: {
        adapter: "manual",
        retrievedAt: "2026-10-05T00:00:00Z",
        sourceVersion: "1.0.0",
      },
    };
    expect(componentSchema.parse(complete)).toEqual(complete);
  });

  it.each(["", "Upper", "a/b", "a_b", "-a", "a-", "a--b", "a b"])(
    "rejects invalid identity segments %j",
    (segment) => {
      expect(() => createComponentId(segment, "terminal")).toThrow(
        RegistryError,
      );
      expect(() => createComponentId("fixture", segment)).toThrow(
        RegistryError,
      );
      expect(
        componentSchema.safeParse({ ...component(), source: segment }).success,
      ).toBe(false);
      expect(
        componentSchema.safeParse({ ...component(), slug: segment }).success,
      ).toBe(false);
    },
  );

  it("constructs and enforces source/slug identity", () => {
    expect(createComponentId("source-2", "terminal-1")).toBe(
      "source-2/terminal-1",
    );
    expect(
      componentSchema.safeParse({ ...component(), id: "fixture/different" })
        .success,
    ).toBe(false);
    expect(
      componentSchema.safeParse({ ...component(), id: " fixture/terminal " })
        .success,
    ).toBe(false);
  });

  it.each([
    { schemaVersion: 2 },
    { name: " " },
    { category: "invented" },
    { secondaryCategories: ["invented"] },
    { frameworks: [] },
    { frameworks: ["angular"] },
    { compatibility: { nextjs: "yes" } },
    { description: 3 },
    { dependencies: [{ name: "react", kind: "vendor", required: true }] },
    { dependencies: [{ name: "react", kind: "runtime", required: "yes" }] },
    { dependencies: [{ name: "", kind: "runtime", required: true }] },
    { installation: { kind: "execute" } },
    { license: { status: "permissive" } },
    { provenance: { adapter: "" } },
    { provenance: { adapter: "manual", retrievedAt: "yesterday" } },
  ])("rejects malformed fields %j", (patch) => {
    expect(
      componentSchema.safeParse({ ...component(), ...patch }).success,
    ).toBe(false);
  });

  it.each(["motion", "density", "radius", "surface", "aesthetics", "tags"])(
    "validates visual.%s",
    (key) => {
      const invalid =
        key === "surface"
          ? ["unsupported"]
          : ["aesthetics", "tags"].includes(key)
            ? [42]
            : "unsupported";
      expect(
        componentSchema.safeParse({
          ...component(),
          visual: { ...component().visual, [key]: invalid },
        }).success,
      ).toBe(false);
    },
  );

  it.each([
    "compatibility",
    "visual",
    "installation",
    "links",
    "license",
    "provenance",
  ])("rejects extra provider keys in %s", (key) => {
    const value = component();
    expect(
      componentSchema.safeParse({
        ...value,
        [key]: {
          ...(value[key as keyof typeof value] as object),
          provider: "leak",
        },
      }).success,
    ).toBe(false);
  });

  it("rejects provider keys at record and dependency level", () => {
    expect(
      componentSchema.safeParse({ ...component(), provider: "leak" }).success,
    ).toBe(false);
    expect(
      componentSchema.safeParse({
        ...component(),
        dependencies: [
          { name: "react", kind: "runtime", required: true, provider: "leak" },
        ],
      }).success,
    ).toBe(false);
  });

  it.each([
    "javascript:alert(1)",
    "data:text/plain,x",
    "file:///tmp/ui",
    "ftp://example.com/ui",
    "/relative",
    "not a URL",
  ])("rejects unsafe links %j", (url) => {
    for (const key of ["homepage", "docs", "preview", "source"]) {
      expect(
        componentSchema.safeParse({ ...component(), links: { [key]: url } })
          .success,
      ).toBe(false);
    }
    expect(
      componentSchema.safeParse({
        ...component(),
        license: { status: "known", identifier: "MIT", source: url },
      }).success,
    ).toBe(false);
  });

  it.each([
    { status: "known" },
    { status: "known", identifier: "MIT" },
    { status: "known", source: "https://example.com/license" },
    { status: "known", identifier: " ", source: "https://example.com/license" },
    { status: "unknown", identifier: "MIT" },
  ])(
    "requires license evidence without inferring an identifier %j",
    (license) => {
      expect(
        componentSchema.safeParse({ ...component(), license }).success,
      ).toBe(false);
    },
  );

  it("allows unknown licenses with review notes and a source of uncertainty", () => {
    expect(
      componentSchema.safeParse({
        ...component(),
        license: {
          status: "unknown",
          source: "https://example.com/terms",
          notes: "Scope unclear",
        },
      }).success,
    ).toBe(true);
  });

  it("requires usable installation guidance for a known installation kind", () => {
    for (const kind of ["command", "copy", "package", "manual"]) {
      expect(
        componentSchema.safeParse({ ...component(), installation: { kind } })
          .success,
      ).toBe(false);
    }
    expect(
      componentSchema.safeParse({
        ...component(),
        installation: { kind: "command", command: " " },
      }).success,
    ).toBe(false);
    expect(
      componentSchema.safeParse({
        ...component(),
        installation: {
          kind: "manual",
          instructions: "Read the documentation",
        },
      }).success,
    ).toBe(true);
    expect(
      componentSchema.safeParse({
        ...component(),
        installation: {
          kind: "copy",
          instructions: "Review the upstream manual",
        },
      }).success,
    ).toBe(true);
    expect(
      componentSchema.safeParse({
        ...component(),
        installation: { kind: "package", command: "npm install fixture" },
      }).success,
    ).toBe(true);
  });
});

describe("registry snapshots", () => {
  it("accepts empty snapshots and canonical records", () => {
    expect(parseRegistry(snapshot([]))).toEqual(snapshot([]));
    expect(parseRegistry(snapshot()).components[0]?.id).toBe(
      "fixture/terminal",
    );
  });

  it.each([
    null,
    [],
    { schemaVersion: 2, components: [] },
    { schemaVersion: 1 },
    { ...snapshot(), provider: "leak" },
    snapshot([{ ...component(), schemaVersion: 2 }]),
  ])("rejects invalid snapshots %j", (input) => {
    expect(() => parseRegistry(input)).toThrow(RegistryError);
  });

  it("reports duplicate IDs at the conflicting component index", () => {
    expect(() => parseRegistry(snapshot([component(), component()]))).toThrow(
      RegistryError,
    );
    const parsed = registrySchema.safeParse(
      snapshot([component(), component()]),
    );
    expect(parsed.success).toBe(false);
    if (!parsed.success)
      expect(parsed.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: ["components", 1, "id"] }),
        ]),
      );
    try {
      parseRegistry(snapshot([component(), component()]));
    } catch (error) {
      expect(error).toBeInstanceOf(RegistryError);
      if (!(error instanceof RegistryError)) throw error;
      expect(error.code).toBe("REGISTRY_INVALID");
      expect(error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["components", 1, "id"],
            message: expect.stringContaining("fixture/terminal"),
          }),
        ]),
      );
      expect(JSON.parse(JSON.stringify(error.issues))).toEqual(error.issues);
      expect(JSON.parse(JSON.stringify(error))).toMatchObject({
        code: "REGISTRY_INVALID",
        issues: error.issues,
      });
      expect(error.message).not.toContain("ZodError");
    }
  });
});

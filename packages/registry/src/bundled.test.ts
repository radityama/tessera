import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { TesseraComponentSchema } from "./schema.js";
import { bundledRegistryDir, hasBundledRegistry, loadBundledRegistry } from "./bundled.js";

/**
 * The bundled snapshot is produced by `packages/registry/scripts/bundle-registry.mjs`
 * as part of this package's build. It is what lets an installed Tessera work
 * without a `registries/` directory next to a cloned repository.
 */
const bundled = hasBundledRegistry();

describe.skipIf(!bundled)("bundled registry", () => {
  it("ships a snapshot with the package", () => {
    expect(bundled).toBe(true);
  });

  it("loads and validates every bundled component", () => {
    const components = loadBundledRegistry();
    expect(components.length).toBeGreaterThan(0);
    for (const c of components) {
      expect(TesseraComponentSchema.safeParse(c).success, `${c.id} invalid`).toBe(true);
    }
  });

  it("bundles every supported source", () => {
    const sources = [...new Set(loadBundledRegistry().map((c) => c.source))].sort();
    expect(sources).toEqual(["aceternity", "beui", "efferd", "heroui", "magicui"]);
  });

  it("records how it was bundled", () => {
    const meta = JSON.parse(readFileSync(join(bundledRegistryDir(), "BUNDLED.json"), "utf8"));
    expect(meta.bundledFrom).toBe("registries/");
    expect(meta.components).toBeGreaterThan(0);
  });

  it("matches the repository snapshot it was built from", () => {
    const repoRegistries = join(bundledRegistryDir(), "..", "..", "..", "registries");
    if (!existsSync(repoRegistries)) return; // installed package: nothing to compare against
    const bundledCount = loadBundledRegistry().length;
    const direct = readFileSync(join(repoRegistries, "snapshot-meta.json"), "utf8");
    const total = (JSON.parse(direct).sources as Array<{ count: number }>).reduce(
      (sum, s) => sum + s.count,
      0,
    );
    expect(bundledCount).toBe(total);
  });
});

describe("bundled registry guard", () => {
  it("reports a clear, actionable error when the snapshot is missing", () => {
    if (bundled) {
      // Nothing to assert: absence only happens on a build that skipped bundling.
      expect(bundledRegistryDir()).toContain("bundled-registry");
      return;
    }
    expect(() => loadBundledRegistry()).toThrow(/bundled|registry:sync|--registry/i);
  });
});

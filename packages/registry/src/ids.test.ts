import { describe, expect, it } from "vitest";
import { assertIdStable, buildId, parseId, slugify } from "./ids.js";

describe("ids", () => {
  it("builds stable kebab ids", () => {
    expect(buildId("BeautifulUI", "Terminal Hero")).toBe("beautifului/terminal-hero");
  });

  it("slugifies", () => {
    expect(slugify("  Grid  Background!! ")).toBe("grid-background");
  });

  it("parses ids", () => {
    expect(parseId("beui/grid-hero")).toEqual({ source: "beui", slug: "grid-hero" });
  });

  it("rejects malformed ids", () => {
    expect(() => parseId("no-slash")).toThrow();
    expect(() => parseId("a/b/c")).toThrow();
  });

  it("asserts id stability", () => {
    expect(() => assertIdStable("a/b", "a", "b")).not.toThrow();
    expect(() => assertIdStable("a/c", "a", "b")).toThrow();
  });

  describe("slugify under hostile input", () => {
    // Registry item names come from third parties, so slugify is a boundary.
    // The obvious implementation used `/^-+|-+$/`, which backtracks
    // polynomially: a provider publishing an item named with a long run of
    // dashes could stall a sync. CodeQL flagged it as js/polynomial-redos.
    const pathological = `a${"-".repeat(200_000)}b`;

    it("stays linear on a long run of separators", () => {
      const started = Date.now();
      const out = slugify(pathological);
      const elapsed = Date.now() - started;
      expect(out).toBe("a-b");
      // Quadratic behaviour on 200k characters takes minutes, so this bound is
      // generous enough not to be flaky while still catching a regression.
      expect(elapsed).toBeLessThan(2000);
    });

    it("stays linear when the input is only separators", () => {
      const started = Date.now();
      expect(slugify("-".repeat(200_000))).toBe("");
      expect(Date.now() - started).toBeLessThan(2000);
    });

    it("collapses interior runs to a single dash", () => {
      expect(slugify("a----b")).toBe("a-b");
      expect(slugify("Hero___Parallax")).toBe("hero-parallax");
    });

    it("strips leading and trailing separators", () => {
      expect(slugify("---hero---")).toBe("hero");
      expect(slugify("!!!")).toBe("");
      expect(slugify("")).toBe("");
    });
  });
});

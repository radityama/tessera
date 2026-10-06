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
});

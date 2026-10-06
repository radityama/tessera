import { describe, expect, it } from "vitest";
import { inferQueryIntent, normalizeQuery, tokenize } from "./query.js";

describe("query", () => {
  it("normalizes whitespace and casing", () => {
    expect(normalizeQuery("  Dark   Technical HERO ")).toBe("dark technical hero");
  });

  it("tokenizes and drops stopwords", () => {
    expect(tokenize("dark hero for a developer")).toContain("hero");
    expect(tokenize("for a the")).toEqual([]);
  });

  it("infers category, framework, motion", () => {
    const intent = inferQueryIntent("dark technical terminal hero subtle motion react");
    expect(intent.category).toBe("hero");
    expect(intent.framework).toBe("react");
    expect(intent.motion).toBe("low");
    expect(intent.aesthetics).toContain("dark");
  });

  it("detects nextjs and product context", () => {
    const intent = inferQueryIntent("developer CLI tool nextjs terminal");
    expect(intent.wantsNextjs).toBe(true);
    expect(intent.productContext).toContain("developer");
  });
});

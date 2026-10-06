import { describe, expect, it } from "vitest";
import { Worker } from "node:worker_threads";
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
    // dashes could stall a sync. CodeQL flags it as js/polynomial-redos.
    const pathological = `a${"-".repeat(200_000)}b`;

    /**
     * Run slugify on a worker with a hard deadline.
     *
     * Asserting on elapsed time after a synchronous call does not work: if the
     * behaviour regressed, the call blocks and the assertion never runs, so the
     * suite hangs instead of failing. The worker can be killed, which turns a
     * hang into a failure. The function source is passed in because the worker
     * cannot import this TypeScript module.
     */
    function slugifyWithDeadline(
      input: string,
      timeoutMs: number,
    ): Promise<{ out: string; ms: number }> {
      return new Promise((resolve, reject) => {
        const worker = new Worker(
          `
          const { parentPort, workerData } = require("node:worker_threads");
          const HYPHEN = 45;
          const slugify = ${slugify.toString()};
          const started = Date.now();
          const out = slugify(workerData);
          parentPort.postMessage({ out, ms: Date.now() - started });
          `,
          { eval: true, workerData: input },
        );

        const timer = setTimeout(() => {
          void worker.terminate();
          reject(
            new Error(`slugify did not finish within ${timeoutMs}ms — likely quadratic again`),
          );
        }, timeoutMs);

        worker.once("message", (msg) => {
          clearTimeout(timer);
          void worker.terminate();
          resolve(msg as { out: string; ms: number });
        });
        worker.once("error", (err) => {
          clearTimeout(timer);
          void worker.terminate();
          reject(err);
        });
      });
    }

    it("stays linear on a long run of separators", async () => {
      const { out, ms } = await slugifyWithDeadline(pathological, 5_000);
      expect(out).toBe("a-b");
      // Generous: quadratic behaviour on 200k characters takes minutes, while
      // the linear implementation takes under a millisecond.
      expect(ms).toBeLessThan(2_000);
    }, 10_000);

    it("stays linear when the input is only separators", async () => {
      const { out } = await slugifyWithDeadline("-".repeat(200_000), 5_000);
      expect(out).toBe("");
    }, 10_000);

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

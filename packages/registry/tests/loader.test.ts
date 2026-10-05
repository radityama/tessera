import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import {
  loadDefaultRegistry,
  loadRegistry,
  mergeRegistries,
  RegistryError,
} from "../src/index.js";
import { component, snapshot } from "./fixtures.js";

const directories: string[] = [];
async function file(contents: string) {
  const directory = await mkdtemp(join(tmpdir(), "tessera-registry-"));
  directories.push(directory);
  const path = join(directory, "registry.json");
  await writeFile(path, contents);
  return path;
}
afterEach(async () => {
  await Promise.all(
    directories
      .splice(0)
      .map((path) => rm(path, { recursive: true, force: true })),
  );
});

describe("file loader", () => {
  it("loads valid UTF-8 JSON using a file path or URL", async () => {
    const input = snapshot([{ ...component(), name: "Terminal 日本語" }]);
    const path = await file(JSON.stringify(input));
    expect(await loadRegistry(path)).toEqual(input);
    expect(await loadRegistry(pathToFileURL(path))).toEqual(input);
  });

  it("accepts an empty local registry", async () => {
    expect(
      await loadRegistry(await file(JSON.stringify(snapshot([])))),
    ).toEqual(snapshot([]));
  });

  it("wraps missing files and unsupported URL schemes as actionable I/O errors", async () => {
    const missing = `${await file("{}")}.missing`;
    await expect(loadRegistry(missing)).rejects.toMatchObject({
      code: "REGISTRY_IO",
      issues: [],
      message: expect.stringContaining(missing),
    });
    await expect(
      loadRegistry(new URL("https://example.com/registry.json")),
    ).rejects.toBeInstanceOf(RegistryError);
  });

  it("distinguishes malformed JSON from invalid canonical data", async () => {
    await expect(
      loadRegistry(await file('{"schemaVersion":')),
    ).rejects.toMatchObject({
      code: "REGISTRY_JSON",
      issues: [],
      message: expect.stringContaining("JSON"),
    });
    await expect(
      loadRegistry(
        await file(
          JSON.stringify(
            snapshot([{ ...component(), frameworks: ["invalid"] }]),
          ),
        ),
      ),
    ).rejects.toMatchObject({
      code: "REGISTRY_INVALID",
      issues: expect.arrayContaining([
        expect.objectContaining({ path: ["components", 0, "frameworks", 0] }),
      ]),
    });
  });
});

describe("merging", () => {
  const another = { ...component(), id: "fixture/alpha", slug: "alpha" };
  it("sorts by canonical ID without mutating input", () => {
    const first = snapshot();
    expect(
      mergeRegistries([first, snapshot([another])]).components.map(
        (record) => record.id,
      ),
    ).toEqual(["fixture/alpha", "fixture/terminal"]);
    expect(first).toEqual(snapshot());
    expect(mergeRegistries([snapshot([another]), first])).toEqual(
      mergeRegistries([first, snapshot([another])]),
    );
  });

  it("accepts no snapshots and empty snapshots", () => {
    expect(mergeRegistries([])).toEqual(snapshot([]));
    expect(mergeRegistries([snapshot([])])).toEqual(snapshot([]));
  });

  it("validates every input and catches duplicates across snapshots", () => {
    expect(() => mergeRegistries([snapshot(), snapshot()])).toThrow(
      RegistryError,
    );
    expect(() =>
      mergeRegistries([snapshot(), { schemaVersion: 2, components: [] }]),
    ).toThrow(RegistryError);
    expect(() =>
      mergeRegistries([{ ...snapshot(), provider: "leak" }]),
    ).toThrow(RegistryError);
  });
});

describe("bundled snapshot", () => {
  it("contains at least 20 distinct reviewed entries from all five sources in ASCII ID order", () => {
    const records = loadDefaultRegistry().components;
    expect(records.length).toBeGreaterThanOrEqual(20);
    expect(new Set(records.map((record) => record.id)).size).toBe(
      records.length,
    );
    expect([...new Set(records.map((record) => record.source))].sort()).toEqual(
      ["aceternity", "beautifului", "beui", "efferd", "heroui"],
    );
    const ids = records.map((record) => record.id);
    expect(ids).toEqual([...ids].sort());
    for (const record of records) {
      expect(record.provenance.adapter).toBe("manual");
      expect(record.provenance.retrievedAt).toBeTruthy();
      expect(record.links.docs).toMatch(/^https:\/\//);
    }
    expect(ids).not.toContain("beautifului/terminal-hero");
  });

  it("returns independent validated data on every load", () => {
    const first = loadDefaultRegistry();
    const original = structuredClone(first);
    first.components.splice(0);
    expect(loadDefaultRegistry()).toEqual(original);
  });
});

import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadRegistryFile } from "./load.js";

/**
 * Repository-wide guard on published registry data.
 *
 * These assertions exist because the earliest version of this project shipped
 * invented provenance: placeholder domains, licenses attributed without
 * evidence, and component names that no upstream library published. Every check
 * here fails loudly if that regresses.
 */

const here = dirname(fileURLToPath(import.meta.url));
const registriesDir = join(here, "..", "..", "..", "registries");

function registryFiles(): string[] {
  if (!existsSync(registriesDir)) return [];
  return readdirSync(registriesDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => join(registriesDir, e.name, "components.json"))
    .filter((p) => existsSync(p))
    .sort();
}

const files = registryFiles();
const components = files.flatMap((f) => loadRegistryFile(f));

/** Reserved, non-routable, or obviously-synthetic hosts. */
const PLACEHOLDER =
  /(^|[/.@])(example\.(com|org|net)|localhost|127\.0\.0\.1|\.invalid|\.test|\.example)([/:]|$)/i;

describe("release guard: published registry data", () => {
  it("has registry data to check", () => {
    expect(files.length).toBeGreaterThan(0);
    expect(components.length).toBeGreaterThan(0);
  });

  it("contains no placeholder domains anywhere in published data", () => {
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      expect(text, `${file} contains a placeholder domain`).not.toMatch(PLACEHOLDER);
    }
  });

  it("never attributes a license without an evidence URL", () => {
    for (const c of components) {
      if (c.license.status === "known") {
        expect(c.license.identifier, `${c.id} claims a license with no identifier`).toBeTruthy();
        expect(c.license.source, `${c.id} claims a license with no evidence`).toMatch(
          /^https:\/\//,
        );
      } else {
        expect(
          c.license.identifier,
          `${c.id} is unknown but carries an identifier`,
        ).toBeUndefined();
      }
    }
  });

  it("gives every component a retrievable path or an explicit none", () => {
    for (const c of components) {
      expect(c.retrieval.kind, `${c.id} is missing retrieval metadata`).toBeTruthy();
      switch (c.retrieval.kind) {
        case "shadcn-registry":
          expect(c.retrieval.itemUrl).toMatch(/^https:\/\//);
          break;
        case "raw-source":
        case "documentation":
          expect(c.retrieval.url).toMatch(/^https:\/\//);
          break;
        case "npm-package":
          expect(c.retrieval.package).toBeTruthy();
          break;
        default:
          break;
      }
    }
  });

  it("retrieves each component from the same host it advertises", () => {
    for (const c of components) {
      if (c.retrieval.kind !== "shadcn-registry") continue;
      const retrieveHost = new URL(c.retrieval.itemUrl).host;
      const advertised = [c.links.homepage, c.links.docs]
        .filter(Boolean)
        .map((u) => new URL(u as string).host);
      expect(advertised, `${c.id} advertises no upstream host`).toContain(retrieveHost);
    }
  });

  it("keeps upstream provenance on every component", () => {
    for (const c of components) {
      expect(c.provenance.adapter, `${c.id} has no adapter`).toBeTruthy();
      expect(c.provenance.retrievedAt, `${c.id} has no retrieval timestamp`).toBeTruthy();
    }
  });

  it("declares which fields Tessera inferred rather than read from upstream", () => {
    for (const c of components) {
      // Classified fields must be declared, or a consumer cannot tell an
      // upstream fact from a Tessera inference.
      if (c.provenance.adapter === "shadcn-registry") {
        expect(
          c.provenance.derivedFields.length,
          `${c.id} declares no derived fields`,
        ).toBeGreaterThan(0);
      }
    }
  });

  it("never marks a non-OSI license as OSI-approved", () => {
    for (const c of components) {
      if (c.license.identifier?.startsWith("LicenseRef-")) {
        expect(c.license.osiApproved, `${c.id} marks a LicenseRef as OSI-approved`).not.toBe(true);
      }
    }
  });

  it("never claims redistribution is permitted for a restricted license", () => {
    for (const c of components) {
      if (c.license.redistribution === "permitted") {
        expect(c.license.status, `${c.id} permits redistribution with unknown license`).toBe(
          "known",
        );
      }
    }
  });
});

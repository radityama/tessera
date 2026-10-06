import { existsSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadRegistryFiles, RegistryError } from "./load.js";
import type { TesseraComponent } from "./schema.js";

/**
 * The registry snapshot that ships inside the published package.
 *
 * `src/bundled.ts` and `dist/bundled.js` both sit one level below the package
 * root, so this resolution is identical in tests and after installation.
 */
export function bundledRegistryDir(): string {
  return resolve(dirname(fileURLToPath(import.meta.url)), "..", "bundled-registry");
}

export function hasBundledRegistry(): boolean {
  return existsSync(bundledRegistryDir());
}

/**
 * Load the registry bundled with this package.
 *
 * This is what makes an installed Tessera work: it does not depend on a
 * `registries/` directory existing next to a cloned repository.
 */
export function loadBundledRegistry(): TesseraComponent[] {
  const dir = bundledRegistryDir();
  if (!existsSync(dir)) {
    throw new RegistryError(
      "no-bundled-registry",
      `this build ships no registry snapshot (expected ${dir}); pass --registry <dir> to point at one`,
    );
  }
  const files = readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(dir, entry.name, "components.json"))
    .filter(existsSync)
    .sort();
  if (files.length === 0) {
    throw new RegistryError("no-bundled-registry", `no components.json found in ${dir}`);
  }
  return loadRegistryFiles(files);
}

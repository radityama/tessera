import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { discoverRegistryFiles, loadRegistryFiles, RegistryError } from "./load.js";
import { hasBundledRegistry, loadBundledRegistry } from "./bundled.js";
import type { TesseraComponent } from "./schema.js";

/**
 * Where the active registry comes from.
 *
 * Precedence, highest first:
 *
 * 1. an explicit `--registry <dir>` from the caller,
 * 2. `TESSERA_REGISTRIES`,
 * 3. a `registries/` directory found walking up from the current directory —
 *    this is the monorepo and contributor case,
 * 4. the snapshot bundled inside the installed package.
 *
 * Step 4 is what makes an installed Tessera work. Without it, the CLI and MCP
 * could only run from inside a clone of this repository.
 */
export function resolveRegistryDir(explicit?: string): string | undefined {
  if (explicit && existsSync(explicit)) return resolve(explicit);
  const env = process.env["TESSERA_REGISTRIES"];
  if (env && existsSync(env)) return resolve(env);
  const cwd = process.cwd();
  for (let i = 0; i <= 5; i++) {
    const candidate =
      i === 0 ? join(cwd, "registries") : join(cwd, ...Array(i).fill(".."), "registries");
    if (existsSync(candidate)) return resolve(candidate);
  }
  return undefined;
}

let cache: TesseraComponent[] | undefined;
let cacheKey = "";

export function loadDefaultRegistry(explicitDir?: string): TesseraComponent[] {
  const dir = resolveRegistryDir(explicitDir);
  const key = dir ?? "<bundled>";
  if (cache && cacheKey === key) return cache;

  let components: TesseraComponent[];
  if (dir) {
    const files = discoverRegistryFiles(dir);
    if (files.length === 0) {
      throw new RegistryError("empty-registry", `no registry files found in ${dir}`);
    }
    components = loadRegistryFiles(files);
  } else if (hasBundledRegistry()) {
    components = loadBundledRegistry();
  } else {
    throw new RegistryError(
      "no-registry",
      "no registry found: pass --registry <dir>, set TESSERA_REGISTRIES, or install a build with a bundled snapshot",
    );
  }

  cache = components;
  cacheKey = key;
  return components;
}

/** Reported by `tessera doctor`; describes where the registry came from. */
export function describeRegistrySource(explicitDir?: string): {
  kind: "explicit" | "env" | "walked-up" | "bundled" | "none";
  path: string | undefined;
} {
  if (explicitDir && existsSync(explicitDir))
    return { kind: "explicit", path: resolve(explicitDir) };
  const env = process.env["TESSERA_REGISTRIES"];
  if (env && existsSync(env)) return { kind: "env", path: resolve(env) };
  const dir = resolveRegistryDir();
  if (dir) return { kind: "walked-up", path: dir };
  if (hasBundledRegistry()) return { kind: "bundled", path: undefined };
  return { kind: "none", path: undefined };
}

export function clearRegistryCache(): void {
  cache = undefined;
  cacheKey = "";
}

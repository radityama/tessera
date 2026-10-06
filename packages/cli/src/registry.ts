import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { discoverRegistryFiles, loadRegistryFiles, type TesseraComponent } from "@tessera/registry";

let cache: TesseraComponent[] | undefined;
let cacheKey = "";

export function resolveRegistriesDir(explicit?: string): string {
  if (explicit && existsSync(explicit)) return resolve(explicit);
  const env = process.env["TESSERA_REGISTRIES"];
  if (env && existsSync(env)) return resolve(env);
  const cwd = process.cwd();
  for (let i = 0; i <= 5; i++) {
    const candidate =
      i === 0 ? join(cwd, "registries") : join(cwd, ...Array(i).fill(".."), "registries");
    if (existsSync(candidate)) return resolve(candidate);
  }
  const here = dirname(fileURLToPath(import.meta.url));
  const fallback = resolve(here, "..", "..", "..", "registries");
  if (existsSync(fallback)) return fallback;
  return resolve(cwd, "registries");
}

export function loadDefaultRegistry(explicitDir?: string): TesseraComponent[] {
  const dir = resolveRegistriesDir(explicitDir);
  if (cache && cacheKey === dir) return cache;
  const files = discoverRegistryFiles(dir);
  if (files.length === 0) {
    const err = new Error(`no registry files found in ${dir} (use --registry <dir>)`) as Error & {
      code: string;
    };
    err.code = "empty-registry";
    throw err;
  }
  cache = loadRegistryFiles(files);
  cacheKey = dir;
  return cache;
}

export function clearRegistryCache(): void {
  cache = undefined;
  cacheKey = "";
}

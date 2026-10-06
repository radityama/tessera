import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { TesseraComponentSchema, type TesseraComponent } from "./schema.js";

export class RegistryError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "RegistryError";
    this.code = code;
  }
}

export function parseComponent(raw: unknown): TesseraComponent {
  const parsed = TesseraComponentSchema.safeParse(raw);
  if (!parsed.success) {
    throw new RegistryError("invalid-component", parsed.error.message);
  }
  return parsed.data;
}

export function findDuplicateIds(components: TesseraComponent[]): string[] {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const c of components) {
    if (seen.has(c.id)) dupes.add(c.id);
    seen.add(c.id);
  }
  return [...dupes].sort();
}

export function validateRegistry(raw: unknown): TesseraComponent[] {
  if (!Array.isArray(raw)) {
    throw new RegistryError("invalid-registry", "registry snapshot must be an array");
  }
  if (raw.length === 0) {
    throw new RegistryError("empty-registry", "registry snapshot is empty");
  }
  const components = raw.map((item, i) => {
    try {
      return parseComponent(item);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new RegistryError("invalid-component", `entry ${i}: ${msg}`);
    }
  });
  const dupes = findDuplicateIds(components);
  if (dupes.length > 0) {
    throw new RegistryError("duplicate-ids", `duplicate component ids: ${dupes.join(", ")}`);
  }
  return components;
}

export function loadRegistryFile(path: string): TesseraComponent[] {
  let text: string;
  try {
    text = readFileSync(path, "utf8");
  } catch {
    throw new RegistryError("unreadable-file", `cannot read registry file: ${path}`);
  }
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new RegistryError("invalid-json", `invalid JSON in registry file: ${path}`);
  }
  const items = Array.isArray(json)
    ? json
    : typeof json === "object" &&
        json !== null &&
        Array.isArray((json as { components?: unknown }).components)
      ? (json as { components: unknown }).components
      : json;
  try {
    return validateRegistry(items);
  } catch (err) {
    if (err instanceof RegistryError) {
      throw new RegistryError(err.code, `${path}: ${err.message}`);
    }
    throw err;
  }
}

export function loadRegistryFiles(paths: string[]): TesseraComponent[] {
  const all: TesseraComponent[] = [];
  for (const p of paths) {
    all.push(...loadRegistryFile(p));
  }
  const dupes = findDuplicateIds(all);
  if (dupes.length > 0) {
    throw new RegistryError(
      "duplicate-ids",
      `duplicate component ids across files: ${dupes.join(", ")}`,
    );
  }
  return all;
}

export function discoverRegistryFiles(registriesDir: string): string[] {
  if (!existsSync(registriesDir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(registriesDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const candidate = join(registriesDir, entry.name, "components.json");
    if (existsSync(candidate)) out.push(candidate);
  }
  return out.sort();
}

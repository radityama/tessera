import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { SCHEMA_VERSION, TesseraComponentSchema, type TesseraComponent } from "./schema.js";

export class RegistryError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "RegistryError";
    this.code = code;
  }
}

/**
 * Reject unsupported schema versions explicitly instead of coercing them.
 *
 * v1 records have no `retrieval` field and no license evidence, so upgrading
 * one would mean inventing answers to "where does this come from?" and "is
 * this usable?". Refusing is the honest option.
 */
function assertSupportedSchemaVersion(raw: unknown): void {
  const version =
    typeof raw === "object" && raw !== null
      ? (raw as { schemaVersion?: unknown }).schemaVersion
      : undefined;
  if (version === SCHEMA_VERSION) return;
  if (version === 1) {
    throw new RegistryError(
      "unsupported-schema-version",
      "schemaVersion 1 is no longer supported: v1 records cannot express retrieval provenance " +
        "or license evidence. Regenerate snapshots with `pnpm registry:sync`.",
    );
  }
  throw new RegistryError(
    "unsupported-schema-version",
    `unsupported schemaVersion ${JSON.stringify(version)}; this build supports ${SCHEMA_VERSION}`,
  );
}

export function parseComponent(raw: unknown): TesseraComponent {
  assertSupportedSchemaVersion(raw);
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

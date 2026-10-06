import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { TesseraComponentSchema, type TesseraComponent } from "@tessera/registry";

export interface RegistryAdapter<TInput> {
  id: string;
  parse(input: TInput): TesseraComponent[];
}

export function toCanonical(raw: unknown): TesseraComponent {
  const parsed = TesseraComponentSchema.safeParse(raw);
  if (!parsed.success) throw new Error(`adapter emitted invalid record: ${parsed.error.message}`);
  return parsed.data;
}

export function normList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === "string")
    .map((s) => s.toLowerCase().trim())
    .filter(Boolean);
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

/**
 * Reduce an npm specifier to its package name.
 *
 * Registry entries routinely carry version specs (`@heroui/react@3.2.6`) or
 * scoped names, and both contain `@`, so a naive split on `@` corrupts scoped
 * packages.
 */
export function npmPackageName(spec: string): string {
  const trimmed = spec.trim();
  if (trimmed.startsWith("@")) {
    const slash = trimmed.indexOf("/");
    if (slash === -1) return trimmed;
    const at = trimmed.indexOf("@", slash);
    return at === -1 ? trimmed : trimmed.slice(0, at);
  }
  const at = trimmed.indexOf("@");
  return at === -1 ? trimmed : trimmed.slice(0, at);
}

export function depList(names: string[]): TesseraComponent["dependencies"] {
  return [...new Set(names.map(npmPackageName).filter(Boolean))].map((name) => ({
    name,
    kind: "runtime" as const,
    required: true,
  }));
}

export function readJsonFile(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8"));
}

export function moduleDir(importMetaUrl: string): string {
  return fileURLToPath(new URL(".", importMetaUrl));
}

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

export function depList(names: string[]): TesseraComponent["dependencies"] {
  return names.map((name) => ({ name, kind: "runtime" as const, required: true }));
}

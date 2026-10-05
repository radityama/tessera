import { readFile } from "node:fs/promises";
import { RegistryError } from "./errors.js";
import {
  parseRegistry,
  SCHEMA_VERSION,
  type RegistrySnapshot,
} from "./schema.js";

export async function loadRegistry(
  path: string | URL,
): Promise<RegistrySnapshot> {
  let contents: string;
  try {
    contents = await readFile(path, "utf8");
  } catch {
    throw new RegistryError(
      "REGISTRY_IO",
      `Cannot read registry at ${String(path)}. Check that the local file exists and is readable; URLs must use file:.`,
    );
  }
  let input: unknown;
  try {
    input = JSON.parse(contents);
  } catch {
    throw new RegistryError(
      "REGISTRY_JSON",
      `Invalid JSON in registry at ${String(path)}. Correct the JSON syntax before loading it.`,
    );
  }
  return parseRegistry(input);
}

export function mergeRegistries(snapshots: unknown[]): RegistrySnapshot {
  const components = snapshots.flatMap((snapshot, index) => {
    try {
      return parseRegistry(snapshot).components;
    } catch (error) {
      if (!(error instanceof RegistryError)) throw error;
      throw new RegistryError(
        error.code,
        `Invalid registry at snapshots[${index}]. ${error.message}`,
        error.issues.map((issue) => ({
          ...issue,
          path: ["snapshots", index, ...issue.path],
        })),
      );
    }
  });
  const registry = parseRegistry({ schemaVersion: SCHEMA_VERSION, components });
  registry.components.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return registry;
}

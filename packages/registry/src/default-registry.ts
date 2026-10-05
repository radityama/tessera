import snapshot from "./data/registry.json" with { type: "json" };
import { mergeRegistries } from "./loader.js";
import type { RegistrySnapshot } from "./schema.js";

export function loadDefaultRegistry(): RegistrySnapshot {
  return mergeRegistries([snapshot]);
}

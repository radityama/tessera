/**
 * The CLI reads the registry through `@tessera-dev/registry`, which owns resolution
 * precedence (explicit flag → env → walked-up directory → bundled snapshot).
 * Re-exported here so existing imports keep working.
 */
export {
  clearRegistryCache,
  describeRegistrySource,
  loadDefaultRegistry,
  resolveRegistryDir,
} from "@tessera-dev/registry";

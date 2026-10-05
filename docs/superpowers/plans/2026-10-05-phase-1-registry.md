# Phase 1 Registry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development to implement this plan task by task.

**Goal:** A validated, packaged local registry with reviewed metadata from five sources.

**Architecture:** `packages/registry` owns canonical types, strict validation, loading, and the bundled snapshot. Source metadata remains local and runtime retrieval requires no HTTP.

**Tech Stack:** Node 24, strict TypeScript ESM, Zod 4, Vitest.

## Spec

`docs/superpowers/specs/2026-10-05-local-pipeline-design.md`, Phase 1, and the original `docs/component-model.md`, `docs/registry-ingestion.md`, `docs/testing.md`, and `docs/security-licensing.md`.

## Global Constraints

- Implement Phase 1 only. No source adapters, ranking, CLI, MCP, or application behavior.
- Never infer license or dependency facts. Do not fetch or store upstream component source code.
- Tests use committed fixtures and temporary local files, never live HTTP.
- Public runtime exports point to compiled ESM and declarations.

## Task 1: Canonical model, loader, and curated snapshot

**Files:** Create `packages/registry/src/schema.ts`, `errors.ts`, `loader.ts`, `default-registry.ts`, `data/registry.json`, `tests/schema.test.ts`, `tests/loader.test.ts`, and local malformed fixtures as needed. Modify `packages/registry/src/index.ts`, `package.json`, `tsconfig.json`, `README.md`, the root README status, and the five source READMEs. Add a separate build config if needed to exclude test output while retaining test typechecking.

- [ ] Write meaningful schema and loader tests first. Cover all model fields, stable IDs, duplicate IDs, record/snapshot version mismatch, invalid nested/provider keys, unsupported enums, unsafe URLs, missing known-license evidence, unknown licenses, empty snapshots, missing files, malformed JSON, and duplicates across merged snapshots.

The fixture should exercise unknown metadata directly:

```ts
const component = {
  schemaVersion: 1,
  id: "fixture/terminal",
  source: "fixture",
  slug: "terminal",
  name: "Terminal",
  category: "terminal",
  secondaryCategories: ["hero"],
  frameworks: ["react"],
  compatibility: {},
  visual: {
    aesthetics: ["technical"],
    tags: ["developer", "cli"],
    motion: "unknown",
    density: "unknown",
    radius: "unknown",
    surface: ["unknown"],
  },
  dependencies: [],
  installation: { kind: "unknown" },
  links: { docs: "https://example.com/terminal" },
  license: { status: "unknown" },
  provenance: { adapter: "manual" },
};
expect(
  parseRegistry({ schemaVersion: 1, components: [component] }).components[0]
    ?.id,
).toBe("fixture/terminal");
expect(() =>
  parseRegistry({ schemaVersion: 1, components: [component, component] }),
).toThrow(RegistryError);
expect(() =>
  componentSchema.parse({ ...component, id: "fixture/different" }),
).toThrow();
```

Run `pnpm --filter @tessera/registry test` and record the expected red failure before implementation.

- [ ] Install an exact compatible Zod 4 release in the registry package and implement the complete canonical schema. Use `z.strictObject`, enum constants, `superRefine` for stable identity/conditional metadata, and `z.infer` for public types. Slugs/source IDs match `^[a-z0-9]+(?:-[a-z0-9]+)*$`. Known licenses require a nonempty identifier and HTTP(S) evidence URL; unknown licenses cannot carry an identifier. Frameworks must be nonempty. Reject provider-only fields instead of silently stripping them.

Required public signatures:

```ts
createComponentId(source: string, slug: string): string;
parseRegistry(input: unknown): RegistrySnapshot;
loadRegistry(path: string | URL): Promise<RegistrySnapshot>;
mergeRegistries(snapshots: unknown[]): RegistrySnapshot;
loadDefaultRegistry(): RegistrySnapshot;
```

`RegistryError` has a stable `code`, actionable `message`, and JSON-serializable `issues` containing paths and messages. Codes distinguish I/O, JSON syntax, and invalid registry data. Do not expose an unhandled Zod stack through a public error message. Snapshot validation detects duplicate IDs with component-index paths.

- [ ] Bundle a committed JSON snapshot under `src/data/registry.json`, imported using the Node ESM JSON import attribute. Validate it on every default load. Sort IDs deterministically. Confirm `tsc` includes the imported JSON in `dist/data/registry.json`; installed runtime imports must work without the repository root.

- [ ] Manually curate at least 20 real entries across Aceternity, Beautiful UI, BeUI, HeroUI, and Efferd. Read bounded official catalog/docs pages only. Metadata annotation notes explain category/style judgment and unknown facts. Do not invent `beautifului/terminal-hero`: that scaffold example has no verified upstream identity. Real verified catalogs: `https://ui.aceternity.com/components`, `https://www.beautifului.dev/`, `https://beui.dev/`, `https://heroui.com/en/docs/react/components`, and `https://efferd.com/blocks`. The controller has verified these official pages. Beautiful UI has Search, Code Block, Records Table, and Prompt Bar. Efferd has free hero-1, hero-2, hero-3 and pricing blocks. Aceternity has Terminal, Spotlight, Background Lines, Text Generate Effect. Verify actual per-entry URLs and any license metadata before recording it. Missing install commands use manual guidance pointing to documentation. Runtime dependency arrays with incomplete metadata must be explicitly explained as incomplete in provenance/source notes and any available confidence field.

- [ ] Remove registry's `--passWithNoTests`, retain strict options, typecheck tests, and exclude tests from build output. Export canonical APIs from `index.ts`. Document schema versions, loader errors, metadata provenance, curated annotations, and package data behavior in the package/source READMEs.

- [ ] Run `pnpm format`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`. Import the compiled registry package in plain Node, load the default snapshot, and verify at least 20 entries across the five sources. Commit with `feat(registry): validate and load curated component snapshots`. Do not push, open PRs, change branches, merge, or publish; the controller handles branch delivery after review.

## Self-review

The task maps every Phase 1 requirement to schema, loader, curated data, fixture tests, or packaging verification. It consumes only the established foundation. Registry signatures, paths, and schema version are consistent. No later-phase product behavior is included.

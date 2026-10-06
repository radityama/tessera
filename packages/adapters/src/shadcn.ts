import { z } from "zod";
import type { License, TesseraComponent } from "@tessera-dev/registry";
import { depList, npmPackageName, slugify, toCanonical } from "./common.js";
import {
  DERIVED_FIELDS,
  inferAesthetics,
  inferCategory,
  inferMotion,
  inferTags,
} from "./classify.js";
import type { ShadcnSource } from "./sources.js";

/**
 * A shadcn registry item, as published by Aceternity, beUI, Efferd and Magic UI.
 *
 * Only `name` and `files` are required. Every other field is optional because
 * the providers genuinely differ — Aceternity omits `dependencies`, Magic UI
 * omits `categories`, and so on. Missing metadata stays missing rather than
 * being filled with a default that would read as fact.
 */
export const ShadcnRegistryItemSchema = z.object({
  name: z.string().min(1),
  type: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  dependencies: z.array(z.string()).optional(),
  registryDependencies: z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
  files: z
    .array(
      z.object({
        path: z.string().min(1),
        content: z.string().optional(),
        type: z.string().optional(),
      }),
    )
    .min(1),
});

export type ShadcnRegistryItem = z.infer<typeof ShadcnRegistryItemSchema>;

export const ShadcnRegistryIndexSchema = z.object({
  name: z.string().min(1),
  homepage: z.string().optional(),
  items: z.array(
    z
      .object({
        name: z.string().min(1),
        type: z.string().optional(),
      })
      .passthrough(),
  ),
});

export function itemUrl(source: ShadcnSource, name: string): string {
  return source.itemUrlTemplate.replace("{name}", name);
}

function installCommand(source: ShadcnSource, name: string): string | undefined {
  if (!source.installCommandTemplate) return undefined;
  return source.installCommandTemplate.replace("{name}", name);
}

export interface NormalizeOptions {
  /**
   * Replace the source's default license for this item. The sync script uses
   * this to downgrade items whose license cannot be attributed to a specific
   * component — for example Efferd items absent from the MIT repository.
   */
  licenseOverride?: License;
  retrievedAt: string;
}

/**
 * Normalize one upstream registry item into the canonical model.
 *
 * Facts are carried through from upstream: name, description, npm dependencies,
 * registry dependencies, and the item's own category list. Classification
 * (category, aesthetics, tags, motion) is Tessera's own inference and is
 * declared in `provenance.derivedFields`.
 */
export function normalizeShadcnItem(
  source: ShadcnSource,
  raw: unknown,
  opts: NormalizeOptions,
): TesseraComponent {
  const item = ShadcnRegistryItemSchema.parse(raw);
  const slug = slugify(item.name);
  const displayName = item.title ?? item.name;
  const upstreamDeps = (item.dependencies ?? []).map(npmPackageName);
  const { category, secondary } = inferCategory(
    `${item.name} ${item.title ?? ""}`,
    item.description,
    item.categories ?? [],
  );

  return toCanonical({
    schemaVersion: 2,
    id: `${source.id}/${slug}`,
    source: source.id,
    slug,
    name: displayName,
    ...(item.description ? { description: item.description } : {}),
    category,
    secondaryCategories: secondary,
    frameworks: source.frameworks,
    compatibility: source.compatibility,
    visual: {
      aesthetics: inferAesthetics(`${item.name} ${item.description ?? ""}`),
      tags: inferTags(`${item.name} ${item.title ?? ""}`, item.description),
      motion: inferMotion(upstreamDeps),
      density: "unknown",
      radius: "unknown",
      surface: ["unknown"],
    },
    dependencies: depList(upstreamDeps),
    installation: {
      kind: "command",
      ...(installCommand(source, item.name)
        ? { command: installCommand(source, item.name) as string }
        : {}),
      instructions:
        source.registryNamespace !== undefined
          ? `Add through the shadcn CLI using the ${source.registryNamespace} namespace, then adapt the copied source to your design tokens.`
          : "Add through the shadcn CLI from the upstream registry URL, then adapt the copied source to your design tokens.",
    },
    retrieval: {
      kind: "shadcn-registry",
      itemUrl: itemUrl(source, item.name),
      ...(source.registryNamespace ? { registryName: source.registryNamespace } : {}),
      ...(installCommand(source, item.name)
        ? { installCommand: installCommand(source, item.name) as string }
        : {}),
    },
    links: { homepage: source.homepage, docs: source.docs },
    license: opts.licenseOverride ?? source.license,
    provenance: {
      adapter: "shadcn-registry",
      upstreamName: item.name,
      retrievedAt: opts.retrievedAt,
      ...(source.kind === "shadcn-registry" ? { sourceVersion: source.registryIndexUrl } : {}),
      derivedFields: [...DERIVED_FIELDS],
    },
  });
}

/**
 * Narrow a source's default license to a specific item.
 *
 * Efferd publishes 231 items but only 40 exist in its MIT repository; the rest
 * belong to the paid tier. Licensing those as MIT because a sibling item was
 * MIT would be exactly the kind of invented provenance Tessera exists to avoid.
 */
export function resolveItemLicense(
  source: ShadcnSource,
  upstreamName: string,
  ossRepoItemNames: Set<string> | undefined,
): License | undefined {
  if (!source.ossRepoRegistryUrl || !ossRepoItemNames) return undefined;
  if (ossRepoItemNames.has(upstreamName)) return undefined;
  return {
    status: "unknown",
    redistribution: "unknown",
    notes:
      "This item is published by the provider's hosted registry but is not present in its open-source repository, so its license could not be attributed. Verify upstream terms before reuse.",
  };
}

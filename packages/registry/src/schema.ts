import { z } from "zod";

/**
 * Canonical registry schema version.
 *
 * v2 adds explicit `retrieval` metadata and license evidence. v1 records are
 * rejected by the loader rather than reinterpreted: v1 had no place to record
 * where an implementation actually comes from, so upgrading one would mean
 * inventing that information.
 */
export const SCHEMA_VERSION = 2 as const;

export const componentCategories = [
  "hero",
  "navbar",
  "feature",
  "pricing",
  "testimonial",
  "cta",
  "footer",
  "background",
  "navigation",
  "form",
  "card",
  "table",
  "dashboard",
  "data-visualization",
  "command-menu",
  "terminal",
  "animation",
  "pattern",
  "other",
] as const;

export const ComponentCategorySchema = z.enum(componentCategories);
export type ComponentCategory = z.infer<typeof ComponentCategorySchema>;

export const FrameworkSchema = z.enum(["react", "vue", "svelte", "html", "other"]);

export const CompatibilitySchema = z.object({
  nextjs: z.boolean().optional(),
  clientComponent: z.boolean().optional(),
  typescript: z.boolean().optional(),
});

export const VisualSchema = z.object({
  aesthetics: z.array(z.string().min(1)).default([]),
  tags: z.array(z.string().min(1)).default([]),
  motion: z.enum(["none", "low", "medium", "high", "unknown"]).default("unknown"),
  density: z.enum(["compact", "normal", "spacious", "unknown"]).default("unknown"),
  radius: z.enum(["none", "small", "medium", "large", "mixed", "unknown"]).default("unknown"),
  surface: z
    .array(z.enum(["flat", "glass", "elevated", "outlined", "gradient", "unknown"]))
    .default(["unknown"]),
});

export const DependencySchema = z.object({
  name: z.string().min(1),
  kind: z.enum(["runtime", "dev", "peer", "unknown"]).default("unknown"),
  required: z.boolean().default(true),
});

export const InstallationSchema = z.object({
  kind: z.enum(["command", "copy", "package", "manual", "unknown"]),
  command: z.string().min(1).optional(),
  instructions: z.string().min(1).optional(),
});

export const LinksSchema = z.object({
  homepage: z.string().url().optional(),
  docs: z.string().url().optional(),
  preview: z.string().url().optional(),
  source: z.string().url().optional(),
});

/**
 * How — and whether — Tessera can obtain the actual implementation for a
 * component. A component with `kind: "none"` is metadata-only: it can be
 * searched and inspected, but there is no artifact to retrieve.
 */
export const RetrievalSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("shadcn-registry"),
    /** Direct URL of the registry item JSON that inlines the source files. */
    itemUrl: z.string().url(),
    /** Namespace used by the shadcn CLI, when the upstream publishes one. */
    registryName: z.string().min(1).optional(),
    installCommand: z.string().min(1).optional(),
  }),
  z.object({
    kind: z.literal("raw-source"),
    url: z.string().url(),
  }),
  z.object({
    kind: z.literal("github-source"),
    repository: z.string().regex(/^[\w.-]+\/[\w.-]+$/, "repository must be <owner>/<repo>"),
    path: z.string().min(1),
    ref: z.string().min(1).optional(),
  }),
  z.object({
    kind: z.literal("npm-package"),
    package: z.string().min(1),
    importHint: z.string().min(1).optional(),
  }),
  z.object({
    kind: z.literal("documentation"),
    url: z.string().url(),
  }),
  z.object({
    kind: z.literal("none"),
    note: z.string().min(1).optional(),
  }),
]);

export type Retrieval = z.infer<typeof RetrievalSchema>;

/**
 * License facts. `status: "known"` requires both an identifier and an evidence
 * URL — a claim without evidence is treated as a validation error, not as
 * trustworthy metadata.
 *
 * `redistribution` answers a different question from `status`: a component can
 * have a perfectly known license that still forbids copying its source into
 * another project. Tessera never vendors source, but an agent needs to know
 * whether the user may.
 */
export const LicenseSchema = z
  .object({
    status: z.enum(["known", "unknown"]),
    identifier: z.string().min(1).optional(),
    /** Evidence: the upstream page or file that states the license. */
    source: z.string().url().optional(),
    verifiedAt: z.string().datetime().optional(),
    /** True only for licenses approved by the Open Source Initiative. */
    osiApproved: z.boolean().optional(),
    redistribution: z.enum(["permitted", "restricted", "unknown"]).optional(),
    notes: z.string().min(1).optional(),
  })
  .superRefine((val, ctx) => {
    if (val.status === "known") {
      if (val.identifier === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["identifier"],
          message: "known license requires an identifier",
        });
      }
      if (val.source === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["source"],
          message: "known license requires an evidence source URL",
        });
      }
    } else if (val.identifier !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["identifier"],
        message: "unknown license must not carry an identifier",
      });
    }
  });

export const ProvenanceSchema = z.object({
  /** Adapter that normalized this record. */
  adapter: z.string().min(1),
  /** The upstream item name this record was normalized from, when distinct. */
  upstreamName: z.string().min(1).optional(),
  retrievedAt: z.string().datetime().optional(),
  sourceVersion: z.string().min(1).optional(),
  /**
   * Fields Tessera inferred during normalization rather than reading from
   * upstream (for example visual tags classified from a component name).
   * Anything not listed here is an upstream fact.
   */
  derivedFields: z.array(z.string().min(1)).default([]),
});

export const ComponentIdSchema = z
  .string()
  .regex(/^[a-z0-9][a-z0-9-]*\/[a-z0-9][a-z0-9-]*$/, "id must be <source>/<slug> in kebab-case");

export const TesseraComponentSchema = z
  .object({
    schemaVersion: z.literal(SCHEMA_VERSION),
    id: ComponentIdSchema,
    source: z.string().regex(/^[a-z0-9][a-z0-9-]*$/, "source must be kebab-case"),
    slug: z.string().regex(/^[a-z0-9][a-z0-9-]*$/, "slug must be kebab-case"),
    name: z.string().min(1),
    description: z.string().min(1).optional(),
    category: ComponentCategorySchema,
    secondaryCategories: z.array(ComponentCategorySchema).default([]),
    frameworks: z.array(FrameworkSchema).min(1),
    compatibility: CompatibilitySchema.default({}),
    visual: VisualSchema.default({}),
    dependencies: z.array(DependencySchema).default([]),
    installation: InstallationSchema,
    retrieval: RetrievalSchema,
    links: LinksSchema.default({}),
    license: LicenseSchema,
    provenance: ProvenanceSchema,
  })
  .superRefine((val, ctx) => {
    if (val.id !== `${val.source}/${val.slug}`) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["id"],
        message: `id "${val.id}" must equal "<source>/<slug>" ("${val.source}/${val.slug}")`,
      });
    }
  });

export type TesseraComponent = z.infer<typeof TesseraComponentSchema>;
export type Framework = z.infer<typeof FrameworkSchema>;
export type License = z.infer<typeof LicenseSchema>;
export type Provenance = z.infer<typeof ProvenanceSchema>;

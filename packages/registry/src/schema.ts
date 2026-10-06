import { z } from "zod";

export const SCHEMA_VERSION = 1 as const;

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

export const LicenseSchema = z.object({
  status: z.enum(["known", "unknown"]),
  identifier: z.string().min(1).optional(),
  source: z.string().min(1).optional(),
  notes: z.string().min(1).optional(),
});

export const ProvenanceSchema = z.object({
  adapter: z.string().min(1),
  retrievedAt: z.string().min(1).optional(),
  sourceVersion: z.string().min(1).optional(),
});

export const ComponentIdSchema = z
  .string()
  .regex(/^[a-z0-9][a-z0-9-]*\/[a-z0-9][a-z0-9-]*$/, "id must be <source>/<slug> in kebab-case");

export const TesseraComponentSchema = z
  .object({
    schemaVersion: z.literal(1),
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
    if (val.license.status === "unknown" && val.license.identifier !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["license", "identifier"],
        message: "unknown license must not carry an identifier",
      });
    }
  });

export type TesseraComponent = z.infer<typeof TesseraComponentSchema>;
export type Framework = z.infer<typeof FrameworkSchema>;

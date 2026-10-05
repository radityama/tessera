import { z } from "zod";
import { RegistryError, type RegistryIssue } from "./errors.js";

export const SCHEMA_VERSION = 1;
export const COMPONENT_CATEGORIES = [
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
export const FRAMEWORKS = ["react", "vue", "svelte", "html", "other"] as const;
export const MOTION_LEVELS = [
  "none",
  "low",
  "medium",
  "high",
  "unknown",
] as const;
export const DENSITIES = ["compact", "normal", "spacious", "unknown"] as const;
export const RADII = [
  "none",
  "small",
  "medium",
  "large",
  "mixed",
  "unknown",
] as const;
export const SURFACES = [
  "flat",
  "glass",
  "elevated",
  "outlined",
  "gradient",
  "unknown",
] as const;
export const DEPENDENCY_KINDS = ["runtime", "dev", "peer", "unknown"] as const;
export const DEPENDENCY_STATUSES = ["known", "unknown"] as const;
export const INSTALLATION_KINDS = [
  "command",
  "copy",
  "package",
  "manual",
  "unknown",
] as const;

const nonempty = z
  .string()
  .refine((value) => value.trim().length > 0, "Expected a nonempty string");
const segment = z
  .string()
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use lowercase letters, numbers, and single internal hyphens",
  );
const httpUrl = z.url({ protocol: /^https?$/ });
const identitySchema = z.strictObject({ source: segment, slug: segment });
const categorySchema = z.enum(COMPONENT_CATEGORIES);
const frameworkSchema = z.enum(FRAMEWORKS);
const motionSchema = z.enum(MOTION_LEVELS);

const installationSchema = z
  .strictObject({
    kind: z.enum(INSTALLATION_KINDS),
    command: nonempty.optional(),
    instructions: nonempty.optional(),
  })
  .superRefine((installation, context) => {
    if (installation.kind === "command" && !installation.command) {
      context.addIssue({
        code: "custom",
        path: ["command"],
        message: "Command installation requires a command",
      });
    }
    if (
      (installation.kind === "manual" || installation.kind === "copy") &&
      !installation.instructions
    ) {
      context.addIssue({
        code: "custom",
        path: ["instructions"],
        message: "Manual and copy installation require instructions",
      });
    }
    if (
      installation.kind === "package" &&
      !installation.command &&
      !installation.instructions
    ) {
      context.addIssue({
        code: "custom",
        path: ["instructions"],
        message: "Package installation requires a command or instructions",
      });
    }
  });

const licenseSchema = z.discriminatedUnion("status", [
  z.strictObject({
    status: z.literal("known"),
    identifier: nonempty,
    source: httpUrl,
    notes: nonempty.optional(),
  }),
  z.strictObject({
    status: z.literal("unknown"),
    source: httpUrl.optional(),
    notes: nonempty.optional(),
  }),
]);

export const componentSchema = z
  .strictObject({
    schemaVersion: z.literal(SCHEMA_VERSION),
    id: nonempty,
    source: segment,
    slug: segment,
    name: nonempty,
    description: nonempty.optional(),
    category: categorySchema,
    secondaryCategories: z.array(categorySchema),
    frameworks: z.array(frameworkSchema).min(1),
    compatibility: z.strictObject({
      nextjs: z.boolean().optional(),
      clientComponent: z.boolean().optional(),
      typescript: z.boolean().optional(),
    }),
    visual: z.strictObject({
      aesthetics: z.array(nonempty),
      tags: z.array(nonempty),
      motion: motionSchema,
      density: z.enum(DENSITIES),
      radius: z.enum(RADII),
      surface: z.array(z.enum(SURFACES)),
    }),
    dependencies: z.array(
      z.strictObject({
        name: nonempty,
        kind: z.enum(DEPENDENCY_KINDS),
        required: z.boolean(),
      }),
    ),
    dependencyStatus: z.enum(DEPENDENCY_STATUSES).default("unknown"),
    installation: installationSchema,
    links: z.strictObject({
      homepage: httpUrl.optional(),
      docs: httpUrl.optional(),
      preview: httpUrl.optional(),
      source: httpUrl.optional(),
    }),
    license: licenseSchema,
    provenance: z.strictObject({
      adapter: nonempty,
      retrievedAt: z.iso.datetime({ offset: true }).optional(),
      sourceVersion: nonempty.optional(),
    }),
  })
  .superRefine((component, context) => {
    const expected = `${component.source}/${component.slug}`;
    if (component.id !== expected) {
      context.addIssue({
        code: "custom",
        path: ["id"],
        message: `Canonical ID must equal source/slug: ${expected}`,
      });
    }
  });

export const registrySchema = z
  .strictObject({
    schemaVersion: z.literal(SCHEMA_VERSION),
    components: z.array(componentSchema),
  })
  .superRefine((registry, context) => {
    const indexes = new Map<string, number>();
    registry.components.forEach((component, index) => {
      const previous = indexes.get(component.id);
      if (previous !== undefined) {
        context.addIssue({
          code: "custom",
          path: ["components", index, "id"],
          message: `Duplicate component ID ${component.id}; first appears at components[${previous}]`,
        });
      } else {
        indexes.set(component.id, index);
      }
    });
  });

export type ComponentCategory = z.infer<typeof categorySchema>;
export type Framework = z.infer<typeof frameworkSchema>;
export type MotionLevel = z.infer<typeof motionSchema>;
export type TesseraComponent = z.infer<typeof componentSchema>;
export type RegistrySnapshot = z.infer<typeof registrySchema>;

function issuesFrom(error: z.ZodError): RegistryIssue[] {
  return error.issues.map((issue) => ({
    path: issue.path.map((key) =>
      typeof key === "number" ? key : String(key),
    ),
    message: issue.message,
  }));
}

export function createComponentId(source: string, slug: string): string {
  const result = identitySchema.safeParse({ source, slug });
  if (!result.success) {
    throw new RegistryError(
      "REGISTRY_INVALID",
      "Cannot create component ID: use valid lowercase source and slug segments.",
      issuesFrom(result.error),
    );
  }
  return `${result.data.source}/${result.data.slug}`;
}

export function parseRegistry(input: unknown): RegistrySnapshot {
  const result = registrySchema.safeParse(input);
  if (!result.success) {
    throw new RegistryError(
      "REGISTRY_INVALID",
      "Invalid registry snapshot. Fix the fields listed in issues and use schemaVersion 1.",
      issuesFrom(result.error),
    );
  }
  return result.data;
}

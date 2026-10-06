import { z } from "zod";
import { ComponentIdSchema, LicenseSchema } from "./schema.js";

/**
 * A concrete implementation retrieved from an upstream provider.
 *
 * Artifacts are produced on demand by `@tessera/core` and handed to the calling
 * agent. Tessera never executes them, never writes them into a project, and
 * never installs their dependencies — the host agent decides what to do with
 * the files.
 */
export const ArtifactFileSchema = z.object({
  /** Path as upstream declares it, e.g. `components/ui/terminal.tsx`. */
  path: z.string().min(1),
  content: z.string(),
  type: z.string().min(1).optional(),
});

export const ComponentArtifactSchema = z.object({
  id: ComponentIdSchema,
  source: z.object({
    provider: z.string().min(1),
    /** The exact upstream URL the artifact was fetched from. */
    upstreamUrl: z.string().url(),
  }),
  files: z.array(ArtifactFileSchema).min(1),
  /** npm packages the component needs at runtime. Not installed automatically. */
  dependencies: z.array(z.string().min(1)).default([]),
  /** Other registry items this component depends on. */
  registryDependencies: z.array(z.string().min(1)).default([]),
  installCommand: z.string().min(1).optional(),
  license: LicenseSchema,
  retrievedAt: z.string().datetime(),
});

export type ArtifactFile = z.infer<typeof ArtifactFileSchema>;
export type ComponentArtifact = z.infer<typeof ComponentArtifactSchema>;

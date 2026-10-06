import type { Framework, License } from "@tessera-dev/registry";

/**
 * Provider descriptors.
 *
 * Every field here is a verified upstream fact. Each was confirmed against the
 * provider's own registry or repository on 2026-10-06 — see docs/sources.md for
 * the evidence table. Nothing in this file is inferred.
 */

export interface ShadcnSource {
  kind: "shadcn-registry";
  id: string;
  name: string;
  homepage: string;
  docs: string;
  /** Registry index listing every item the provider publishes publicly. */
  registryIndexUrl: string;
  /** Item endpoint; `{name}` is replaced with the upstream item name. */
  itemUrlTemplate: string;
  /** Namespace used by the shadcn CLI, when the provider publishes one. */
  registryNamespace?: string;
  installCommandTemplate?: string;
  /**
   * Default license for items from this source. `ossRepoRegistryUrl` narrows
   * this per item: anything absent from the listed open-source registry is
   * downgraded to an unknown license rather than inheriting a guess.
   */
  license: License;
  ossRepoRegistryUrl?: string;
  frameworks: Framework[];
  compatibility: { nextjs?: boolean; clientComponent?: boolean; typescript?: boolean };
}

export interface NpmSource {
  kind: "npm-package";
  id: string;
  name: string;
  homepage: string;
  docs: string;
  package: string;
  importHint: string;
  installCommand: string;
  license: License;
  frameworks: Framework[];
  compatibility: { nextjs?: boolean; clientComponent?: boolean; typescript?: boolean };
}

export type Source = ShadcnSource | NpmSource;

const VERIFIED_AT = "2026-10-06T00:00:00.000Z";

export const sources: Source[] = [
  {
    kind: "shadcn-registry",
    id: "aceternity",
    name: "Aceternity UI",
    homepage: "https://ui.aceternity.com/",
    docs: "https://ui.aceternity.com/components",
    registryIndexUrl: "https://ui.aceternity.com/registry.json",
    itemUrlTemplate: "https://ui.aceternity.com/registry/{name}.json",
    registryNamespace: "@aceternity",
    installCommandTemplate: "npx shadcn@latest add @aceternity/{name}",
    license: {
      status: "known",
      identifier: "LicenseRef-Aceternity",
      source: "https://ui.aceternity.com/licence",
      verifiedAt: VERIFIED_AT,
      osiApproved: false,
      redistribution: "restricted",
      notes:
        "Aceternity's own license, not an OSI license. Free components may be used in personal and commercial projects, but redistributing their source files or reselling them is not permitted. Tessera fetches these on request and does not vendor them.",
    },
    frameworks: ["react"],
    compatibility: { nextjs: true, clientComponent: true, typescript: true },
  },
  {
    kind: "shadcn-registry",
    id: "beui",
    name: "beUI",
    homepage: "https://beui.dev/",
    docs: "https://beui.dev/docs/theme",
    registryIndexUrl: "https://beui.dev/r/registry.json",
    itemUrlTemplate: "https://beui.dev/r/{name}.json",
    installCommandTemplate: "npx shadcn@latest add https://beui.dev/r/{name}.json",
    license: {
      status: "known",
      identifier: "MIT",
      source: "https://github.com/starc007/ui-components/blob/main/LICENSE",
      verifiedAt: VERIFIED_AT,
      osiApproved: true,
      redistribution: "permitted",
      notes: "Free components are MIT. A separate paid tier exists at pro.beui.dev.",
    },
    frameworks: ["react"],
    compatibility: { nextjs: true, clientComponent: true, typescript: true },
  },
  {
    kind: "shadcn-registry",
    id: "efferd",
    name: "Efferd",
    homepage: "https://efferd.com/",
    docs: "https://efferd.com/docs",
    registryIndexUrl: "https://efferd.com/r/registry.json",
    itemUrlTemplate: "https://efferd.com/r/{name}.json",
    installCommandTemplate: "npx shadcn@latest add https://efferd.com/r/{name}.json",
    // The hosted catalogue is much larger than the MIT repository, so a
    // per-item check is the only defensible way to attribute a license.
    ossRepoRegistryUrl: "https://raw.githubusercontent.com/shabanhr/efferd-ui/main/registry.json",
    license: {
      status: "known",
      identifier: "MIT",
      source: "https://github.com/shabanhr/efferd-ui/blob/main/LICENCE.md",
      verifiedAt: VERIFIED_AT,
      osiApproved: true,
      redistribution: "permitted",
      notes: "MIT applies to items published in the efferd-ui repository.",
    },
    frameworks: ["react"],
    compatibility: { nextjs: true, clientComponent: true, typescript: true },
  },
  {
    kind: "shadcn-registry",
    id: "magicui",
    name: "Magic UI",
    homepage: "https://magicui.design/",
    docs: "https://magicui.design/docs",
    registryIndexUrl: "https://magicui.design/r/registry.json",
    itemUrlTemplate: "https://magicui.design/r/{name}.json",
    installCommandTemplate: "npx shadcn@latest add https://magicui.design/r/{name}.json",
    license: {
      status: "known",
      identifier: "MIT",
      source: "https://github.com/magicuidesign/magicui/blob/main/LICENSE.md",
      verifiedAt: VERIFIED_AT,
      osiApproved: true,
      redistribution: "permitted",
    },
    frameworks: ["react"],
    compatibility: { nextjs: true, clientComponent: true, typescript: true },
  },
  {
    kind: "npm-package",
    id: "heroui",
    name: "HeroUI",
    homepage: "https://www.heroui.com/",
    docs: "https://www.heroui.com/docs",
    package: "@heroui/react",
    importHint: "import { Button, Card } from '@heroui/react'",
    installCommand: "npm install @heroui/react",
    license: {
      status: "known",
      identifier: "MIT",
      source: "https://registry.npmjs.org/@heroui/react",
      verifiedAt: VERIFIED_AT,
      osiApproved: true,
      redistribution: "permitted",
      notes:
        "The published npm package declares MIT. The repository's default branch carries an Apache-2.0 LICENSE file, so the repository and the shipped artifact disagree; the npm metadata is recorded here because it governs the artifact users actually install.",
    },
    frameworks: ["react"],
    compatibility: { nextjs: true, typescript: true },
  },
];

export function getSource(id: string): Source {
  const found = sources.find((s) => s.id === id);
  if (!found) throw new Error(`unknown source "${id}"`);
  return found;
}

export function shadcnSources(): ShadcnSource[] {
  return sources.filter((s): s is ShadcnSource => s.kind === "shadcn-registry");
}

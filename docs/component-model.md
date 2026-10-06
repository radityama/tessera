# Component model

The canonical record every adapter produces and every consumer reads. Defined in
`packages/registry/src/schema.ts` and validated with Zod. **Current version: `2`.**

Schema v1 is rejected by the loader rather than upgraded. v1 had nowhere to record where an
implementation comes from or what evidence backs its license, so converting one would mean
inventing those answers. Regenerate with `pnpm registry:sync`.

## Shape

```ts
interface TesseraComponent {
  schemaVersion: 2;
  id: string; // "<source>/<slug>", kebab-case, stable
  source: string;
  slug: string;
  name: string;
  description?: string;
  category: ComponentCategory;
  secondaryCategories: ComponentCategory[];
  frameworks: Framework[];
  compatibility: { nextjs?: boolean; clientComponent?: boolean; typescript?: boolean };
  visual: VisualProfile;
  dependencies: Dependency[];
  installation: Installation;
  retrieval: Retrieval;
  links: { homepage?: string; docs?: string; preview?: string; source?: string };
  license: License;
  provenance: Provenance;
}
```

## Retrieval

The field v1 lacked. It answers _where the implementation actually comes from_ and _whether
Tessera can obtain it_.

```ts
type Retrieval =
  | { kind: "shadcn-registry"; itemUrl: string; registryName?: string; installCommand?: string }
  | { kind: "raw-source"; url: string }
  | { kind: "github-source"; repository: string; path: string; ref?: string }
  | { kind: "npm-package"; package: string; importHint?: string }
  | { kind: "documentation"; url: string }
  | { kind: "none"; note?: string };
```

`kind: "none"` means metadata-only: the component can be searched and inspected, but there is
no artifact to retrieve. Consumers must distinguish that from a retrieval that is merely
unavailable right now.

## License

```ts
interface License {
  status: "known" | "unknown";
  identifier?: string; // required when known
  source?: string; // evidence URL — required when known
  verifiedAt?: string;
  osiApproved?: boolean;
  redistribution?: "permitted" | "restricted" | "unknown";
  notes?: string;
}
```

Enforced by validation:

- `status: "known"` **requires** both an `identifier` and an evidence `source` URL. A license
  claim without evidence fails validation rather than being trusted.
- `status: "unknown"` **must not** carry an `identifier`.
- `source` must be a URL.

`status` and `redistribution` answer different questions. Aceternity's license is perfectly
_known_ — it is `LicenseRef-Aceternity` — while still being `restricted` for redistribution.
A component can therefore be legitimate to index and fetch while remaining illegitimate to
vendor. Schema v1 could not express that distinction.

Non-SPDX licenses use the SPDX `LicenseRef-` convention rather than being forced into an
OSI identifier they do not have.

## Provenance and derived fields

```ts
interface Provenance {
  adapter: string;
  upstreamName?: string;
  retrievedAt?: string;
  sourceVersion?: string;
  derivedFields: string[];
}
```

Tessera cannot read a component's intent from a registry entry, so it classifies some fields
itself: `category`, `secondaryCategories`, `visual.aesthetics`, `visual.tags`, `visual.motion`.
Those are listed in `derivedFields`. **Anything not listed is an upstream fact.**

Classification follows a fixed precedence — the provider's own category list first, then the
component name, then its description. Description is last because prose describes what is
_inside_ a component rather than what it is: "Modern sign-in page with particle background" is
a form, not a background.

Where no signal exists, the field stays `unknown`. Motion, density, radius and surface are
frequently `unknown`, which is accurate — the registry entry genuinely does not say.

## Artifacts

Retrieved source is a separate type, produced on demand and never persisted
(`packages/registry/src/artifact.ts`):

```ts
interface ComponentArtifact {
  id: string;
  source: { provider: string; upstreamUrl: string };
  files: Array<{ path: string; content: string; type?: string }>;
  dependencies: string[];
  registryDependencies: string[];
  installCommand?: string;
  license: License;
  retrievedAt: string;
}
```

Tessera never executes artifact files, never writes them into a project, and never installs
their dependencies. That decision belongs to the calling agent.

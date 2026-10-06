/**
 * Registry sync.
 *
 * Pulls verified upstream metadata into pinned, reviewable snapshots under
 * `registries/`. This is the only place that touches the network during
 * registry construction; search, inspect and similar never do.
 *
 * Design notes:
 * - Deterministic output. Items are sorted by name and the snapshot records
 *   exactly which upstream endpoints produced it, so a re-run diff is honest.
 * - Failures are loud. A provider that changes shape aborts the sync rather
 *   than silently emitting a smaller catalogue.
 * - Licensing is narrowed per item where a provider mixes free and paid
 *   content, never assumed from a sibling item.
 *
 * Usage: pnpm --filter @tessera-dev/adapters sync
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ShadcnRegistryIndexSchema,
  normalizeShadcnItem,
  resolveItemLicense,
  type ShadcnRegistryItem,
} from "./shadcn.js";
import { getSource, shadcnSources, type ShadcnSource } from "./sources.js";
import { buildHeroUiComponent, herouiComponents } from "./heroui.js";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..", "..", "..");
const registriesDir = join(repoRoot, "registries");

const FETCH_TIMEOUT_MS = 30_000;
const FETCH_ATTEMPTS = 4;
/** Target number of retrievable components per provider. */
const MAX_ITEMS_PER_SOURCE = 20;
/**
 * Providers publish far more items than we index, and some list items whose
 * endpoints are auth-gated. Cap how many candidates we probe so a hostile
 * registry cannot turn a sync into an unbounded crawl.
 */
const MAX_CANDIDATES_PER_SOURCE = 90;

/**
 * Components worth indexing for v0.1, ordered by how much of a page they
 * represent. Page-scale sections come first; decorative backgrounds next;
 * generic primitives last. Ordering matters because it decides which items win
 * the per-source budget, so it is explicit rather than incidental.
 */
const RELEVANCE_TIERS: RegExp[] = [
  /hero/i,
  /navbar|navigation/i,
  /pricing/i,
  /command|terminal/i,
  /dashboard|app-shell|table/i,
  /cta|footer|feature|faq|testimonial|contact|auth|login|sign-?up|form/i,
  /background|grid|aurora|spotlight|beams?|warp|meteor|stars?|flicker/i,
  /bento|marquee|card/i,
];

/**
 * Providers publish demo/example entries that exist to illustrate a component
 * rather than to be one. Those are excluded, including numbered variants such
 * as `features-section-demo-1`.
 */
const EXCLUDE = /(^demo-|-demo($|[-_]\d)|-example($|[-_]\d)|-preview($|[-_]\d))/i;

/** Non-visual registry entry types are not page sections. */
const EXCLUDED_TYPES = new Set(["registry:example", "registry:style", "registry:theme"]);

/** An HTTP status the provider returned that we treat as "not public". */
export class UpstreamStatusError extends Error {
  constructor(
    readonly status: number,
    readonly url: string,
  ) {
    super(`${status} for ${url}`);
    this.name = "UpstreamStatusError";
  }
}

/** Statuses that mean "this item is not publicly retrievable", not "we broke". */
const NOT_PUBLIC = new Set([401, 403, 404]);

/**
 * Providers sit behind CDNs that intermittently reject non-browser clients.
 * Retry with backoff so a transient edge response does not look like a contract
 * change.
 */
async function fetchJson(url: string): Promise<unknown> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= FETCH_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          "user-agent": "tessera-registry-sync/0.1",
          accept: "application/json",
        },
      });
      if (!res.ok) {
        // Never retry a definitive "not public" answer — it will not change.
        if (NOT_PUBLIC.has(res.status)) throw new UpstreamStatusError(res.status, url);
        throw new Error(`${res.status} ${res.statusText}`);
      }
      return await res.json();
    } catch (err) {
      if (err instanceof UpstreamStatusError) throw err;
      lastError = err;
      if (attempt < FETCH_ATTEMPTS) {
        await new Promise((r) => setTimeout(r, attempt * 750));
      }
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error(`${url}: ${String(lastError)} (after ${FETCH_ATTEMPTS} attempts)`);
}

interface Selection {
  name: string;
  type: string | undefined;
}

function relevanceTier(name: string): number {
  const index = RELEVANCE_TIERS.findIndex((re) => re.test(name));
  return index === -1 ? RELEVANCE_TIERS.length : index;
}

/** Order candidates by product relevance, then alphabetically for stability. */
export function selectItems(index: unknown, _source: ShadcnSource): Selection[] {
  void _source;
  const parsed = ShadcnRegistryIndexSchema.parse(index);
  return parsed.items
    .filter((item) => relevanceTier(item.name) < RELEVANCE_TIERS.length)
    .filter((item) => !EXCLUDE.test(item.name))
    .filter((item) => !EXCLUDED_TYPES.has(item.type ?? ""))
    .sort((a, b) => {
      const tier = relevanceTier(a.name) - relevanceTier(b.name);
      return tier !== 0 ? tier : a.name.localeCompare(b.name);
    })
    .slice(0, MAX_CANDIDATES_PER_SOURCE)
    .map((item) => ({ name: item.name, type: item.type }));
}

async function ossRepoItemNames(source: ShadcnSource): Promise<Set<string> | undefined> {
  if (!source.ossRepoRegistryUrl) return undefined;
  const index = await fetchJson(source.ossRepoRegistryUrl);
  const parsed = ShadcnRegistryIndexSchema.parse(index);
  return new Set(parsed.items.map((i) => i.name));
}

async function syncShadcnSource(
  source: ShadcnSource,
): Promise<{ components: unknown[]; skipped: string[] }> {
  process.stderr.write(`  ${source.id}: fetching ${source.registryIndexUrl}\n`);
  const index = await fetchJson(source.registryIndexUrl);
  const selection = selectItems(index, source);
  if (selection.length === 0) throw new Error(`${source.id}: upstream index produced no items`);

  const ossNames = await ossRepoItemNames(source);
  const retrievedAt = new Date().toISOString();
  const components: unknown[] = [];
  const skipped: string[] = [];

  for (const { name } of selection) {
    if (components.length >= MAX_ITEMS_PER_SOURCE) break;
    const url = source.itemUrlTemplate.replace("{name}", name);
    let raw: (ShadcnRegistryItem & { files?: unknown[] }) | undefined;
    try {
      raw = (await fetchJson(url)) as ShadcnRegistryItem & { files?: unknown[] };
    } catch (err) {
      // A provider may list an item in its public index while keeping the item
      // endpoint behind auth. Such an item has no retrievable artifact, so it
      // does not belong in a snapshot that promises retrieval.
      if (err instanceof UpstreamStatusError && NOT_PUBLIC.has(err.status)) {
        skipped.push(name);
        continue;
      }
      throw err;
    }
    if (!Array.isArray(raw.files) || raw.files.length === 0) {
      throw new Error(`${source.id}/${name}: upstream item has no files`);
    }
    const licenseOverride = resolveItemLicense(source, name, ossNames);
    components.push(
      normalizeShadcnItem(source, raw, {
        retrievedAt,
        ...(licenseOverride ? { licenseOverride } : {}),
      }),
    );
  }

  if (components.length === 0) throw new Error(`${source.id}: no retrievable items`);
  process.stderr.write(
    `  ${source.id}: ${components.length} components` +
      (skipped.length > 0 ? ` (${skipped.length} not public, skipped)` : "") +
      "\n",
  );
  return { components, skipped };
}

function writeSnapshot(sourceId: string, components: unknown[]): void {
  const dir = join(registriesDir, sourceId);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "components.json"), `${JSON.stringify(components, null, 2)}\n`);
}

export async function syncAll(): Promise<void> {
  const generatedAt = new Date().toISOString();
  const summary: Array<{ id: string; count: number; skipped: number }> = [];

  for (const source of shadcnSources()) {
    const { components, skipped } = await syncShadcnSource(source);
    writeSnapshot(source.id, components);
    summary.push({ id: source.id, count: components.length, skipped: skipped.length });
  }

  const heroSource = getSource("heroui");
  const hero = herouiComponents.map((entry) => buildHeroUiComponent(entry, generatedAt));
  writeSnapshot(heroSource.id, hero);
  summary.push({ id: heroSource.id, count: hero.length, skipped: 0 });

  writeFileSync(
    join(registriesDir, "snapshot-meta.json"),
    `${JSON.stringify(
      {
        generatedAt,
        generator: "packages/adapters/src/sync.ts",
        note: "Regenerate with `pnpm registry:sync`. Do not edit components.json by hand.",
        sources: summary,
      },
      null,
      2,
    )}\n`,
  );

  process.stderr.write(
    `registry sync complete: ${summary
      .map((s) => `${s.id}=${s.count}${s.skipped ? `(-${s.skipped})` : ""}`)
      .join(" ")}\n`,
  );
}

const invokedDirectly = typeof process.argv[1] === "string" && process.argv[1].endsWith("/sync.js");

if (invokedDirectly) {
  syncAll().catch((err) => {
    process.stderr.write(`registry sync failed: ${String(err)}\n`);
    process.exitCode = 1;
  });
}

import {
  ComponentArtifactSchema,
  type ComponentArtifact,
  type TesseraComponent,
} from "@tessera-dev/registry";
import { z } from "zod";

/**
 * Provider-neutral artifact retrieval.
 *
 * This is the only part of Tessera that fetches anything, and it is deliberately
 * narrow:
 *
 * - the upstream URL always comes from the registry snapshot, never from the
 *   caller, so a caller cannot point Tessera at an arbitrary host;
 * - redirects are followed manually and every hop's origin must be on an
 *   allowlist derived from that same snapshot;
 * - requests are bounded by a timeout and a response size cap;
 * - the payload is validated before anything is returned;
 * - returned files are handed back to the caller and never executed, written,
 *   or installed.
 */

export interface RetrievalOptions {
  /** Injected in tests; defaults to the global fetch. */
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  maxBytes?: number;
  maxRedirects?: number;
  now?: () => Date;
}

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_MAX_BYTES = 1_000_000;
const DEFAULT_MAX_REDIRECTS = 3;

export type RetrievalErrorCode =
  | "component-not-found"
  | "artifact-unavailable"
  | "retrieval-not-supported"
  | "blocked-origin"
  | "provider-unreachable"
  | "provider-contract-invalid"
  | "response-too-large";

export class RetrievalError extends Error {
  readonly code: RetrievalErrorCode;
  readonly detail: Record<string, unknown>;
  constructor(code: RetrievalErrorCode, message: string, detail: Record<string, unknown> = {}) {
    super(message);
    this.name = "RetrievalError";
    this.code = code;
    this.detail = detail;
  }
}

/** The shadcn registry item payload, as published by Aceternity, beUI, Efferd and Magic UI. */
const RegistryItemPayloadSchema = z.object({
  name: z.string().min(1),
  type: z.string().optional(),
  title: z.string().optional(),
  dependencies: z.array(z.string()).optional(),
  registryDependencies: z.array(z.string()).optional(),
  files: z
    .array(
      z.object({
        path: z.string().min(1),
        content: z.string().min(1),
        type: z.string().optional(),
      }),
    )
    .min(1),
});

/**
 * Origins Tessera is willing to fetch from.
 *
 * Derived from the hosts the registry *advertises* (`links`), deliberately not
 * from `retrieval` — deriving the allowlist from the URL being fetched would be
 * circular, and a single corrupt record could then whitelist any host it liked.
 * A component may only be fetched from a host it already claims as its own.
 */
export function allowedOrigins(registry: TesseraComponent[]): Set<string> {
  const origins = new Set<string>();
  for (const c of registry) {
    for (const link of [c.links.homepage, c.links.docs, c.links.preview]) {
      if (link) origins.add(new URL(link).origin);
    }
  }
  return origins;
}

function fail(
  code: RetrievalErrorCode,
  message: string,
  detail: Record<string, unknown> = {},
): never {
  throw new RetrievalError(code, message, detail);
}

/** Read a response body, aborting once `maxBytes` is exceeded. */
async function readCapped(res: Response, maxBytes: number, url: string): Promise<string> {
  const declared = Number(res.headers.get("content-length") ?? Number.NaN);
  if (Number.isFinite(declared) && declared > maxBytes) {
    fail("response-too-large", `response from ${url} declares ${declared} bytes`, {
      url,
      maxBytes,
    });
  }
  if (!res.body) return await res.text();

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let text = "";
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => undefined);
      fail("response-too-large", `response from ${url} exceeded ${maxBytes} bytes`, {
        url,
        maxBytes,
      });
    }
    text += decoder.decode(value, { stream: true });
  }
  return text + decoder.decode();
}

/**
 * Fetch JSON from an allowlisted origin, validating the origin of every
 * redirect hop before following it.
 */
async function fetchJson(
  startUrl: string,
  allow: Set<string>,
  opts: Required<Pick<RetrievalOptions, "timeoutMs" | "maxBytes" | "maxRedirects">> & {
    fetchImpl: typeof fetch;
  },
): Promise<{ payload: unknown; finalUrl: string }> {
  let url = startUrl;
  for (let hop = 0; hop <= opts.maxRedirects; hop++) {
    const origin = new URL(url).origin;
    if (!allow.has(origin)) {
      fail("blocked-origin", `refusing to fetch ${url}: origin ${origin} is not allowlisted`, {
        url,
        origin,
      });
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), opts.timeoutMs);
    let res: Response;
    try {
      res = await opts.fetchImpl(url, {
        redirect: "manual",
        signal: controller.signal,
        headers: { accept: "application/json", "user-agent": "tessera-fetch/0.1" },
      });
    } catch (err) {
      const aborted = err instanceof Error && err.name === "AbortError";
      fail(
        "provider-unreachable",
        aborted ? `request to ${url} timed out` : `request to ${url} failed: ${String(err)}`,
        { url },
      );
    } finally {
      clearTimeout(timer);
    }

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location)
        fail("provider-contract-invalid", `${url} redirected without a Location`, { url });
      url = new URL(location, url).toString();
      continue;
    }

    if (res.status === 401 || res.status === 403) {
      fail("artifact-unavailable", `upstream refused access to ${url} (${res.status})`, {
        url,
        status: res.status,
      });
    }
    if (res.status === 404) {
      fail("artifact-unavailable", `upstream has no artifact at ${url}`, { url, status: 404 });
    }
    if (!res.ok) {
      fail("provider-unreachable", `upstream returned ${res.status} for ${url}`, {
        url,
        status: res.status,
      });
    }

    const text = await readCapped(res, opts.maxBytes, url);
    let payload: unknown;
    try {
      payload = JSON.parse(text);
    } catch {
      fail("provider-contract-invalid", `upstream response from ${url} was not JSON`, { url });
    }
    return { payload, finalUrl: url };
  }
  fail("provider-contract-invalid", `too many redirects fetching ${startUrl}`, {
    url: startUrl,
    maxRedirects: opts.maxRedirects,
  });
}

/**
 * Retrieve the real implementation for a component.
 *
 * Throws a `RetrievalError` carrying a stable `code` for every failure mode, so
 * callers can present a specific message instead of a stack trace.
 */
export async function resolveComponentArtifact(
  registry: TesseraComponent[],
  id: string,
  options: RetrievalOptions = {},
): Promise<ComponentArtifact> {
  const component = registry.find((c) => c.id === id);
  if (!component) {
    fail("component-not-found", `unknown component id "${id}"`, { id });
  }

  const retrieval = component.retrieval;
  const now = options.now ?? (() => new Date());

  if (retrieval.kind === "none") {
    fail(
      "artifact-unavailable",
      `${id} is metadata-only: no retrievable artifact is published for it`,
      { id, kind: retrieval.kind },
    );
  }
  if (retrieval.kind === "npm-package") {
    fail(
      "artifact-unavailable",
      `${id} ships as the npm package "${retrieval.package}"; install it with a package manager rather than fetching files`,
      { id, kind: retrieval.kind, package: retrieval.package },
    );
  }
  if (retrieval.kind === "documentation") {
    fail(
      "artifact-unavailable",
      `${id} is documented at ${retrieval.url} but publishes no retrievable artifact`,
      { id, kind: retrieval.kind, url: retrieval.url },
    );
  }
  if (retrieval.kind === "github-source") {
    fail(
      "retrieval-not-supported",
      `${id} resolves to GitHub source (${retrieval.repository}); Tessera v0.1 does not fetch GitHub paths`,
      { id, kind: retrieval.kind, repository: retrieval.repository },
    );
  }

  const allow = allowedOrigins(registry);
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  const targetUrl = retrieval.kind === "shadcn-registry" ? retrieval.itemUrl : retrieval.url;
  const { payload, finalUrl } = await fetchJson(targetUrl, allow, {
    fetchImpl,
    timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    maxBytes: options.maxBytes ?? DEFAULT_MAX_BYTES,
    maxRedirects: options.maxRedirects ?? DEFAULT_MAX_REDIRECTS,
  });

  const parsed = RegistryItemPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    fail(
      "provider-contract-invalid",
      `artifact from ${finalUrl} did not match the expected registry item shape`,
      { url: finalUrl, issues: parsed.error.issues.map((i) => i.path.join(".")) },
    );
  }

  return ComponentArtifactSchema.parse({
    id: component.id,
    source: { provider: component.source, upstreamUrl: finalUrl },
    files: parsed.data.files.map((f) => ({
      path: f.path,
      content: f.content,
      ...(f.type ? { type: f.type } : {}),
    })),
    dependencies: parsed.data.dependencies ?? [],
    registryDependencies: parsed.data.registryDependencies ?? [],
    ...(retrieval.kind === "shadcn-registry" && retrieval.installCommand
      ? { installCommand: retrieval.installCommand }
      : {}),
    license: component.license,
    retrievedAt: now().toISOString(),
  });
}

/** Whether an artifact can be obtained at all, without performing a fetch. */
export function isRetrievable(component: TesseraComponent): boolean {
  return (
    component.retrieval.kind === "shadcn-registry" || component.retrieval.kind === "raw-source"
  );
}

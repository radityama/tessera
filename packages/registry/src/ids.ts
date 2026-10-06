const HYPHEN = 45;

/**
 * Convert arbitrary text to a kebab-case slug.
 *
 * Input here can come from a third-party registry, so it is treated as
 * untrusted. The obvious implementation uses `/^-+|-+$/` to strip edge dashes,
 * which backtracks polynomially on a long run of `-`: a provider publishing an
 * item named `--------------------------------…` would stall the sync. CodeQL
 * flags it as `js/polynomial-redos`, and it is right.
 *
 * Scanning for the edges instead cannot backtrack. The `[^a-z0-9]+` collapse
 * already guarantees single dashes internally, so the old `-{2,}` pass was
 * redundant as well.
 */
export function slugify(input: string): string {
  const collapsed = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-");
  let start = 0;
  let end = collapsed.length;
  while (start < end && collapsed.charCodeAt(start) === HYPHEN) start += 1;
  while (end > start && collapsed.charCodeAt(end - 1) === HYPHEN) end -= 1;
  return collapsed.slice(start, end);
}

export function buildId(source: string, slug: string): string {
  return `${slugify(source)}/${slugify(slug)}`;
}

export function parseId(id: string): { source: string; slug: string } {
  const parts = id.split("/");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error(`invalid component id "${id}": expected <source>/<slug>`);
  }
  return { source: parts[0] as string, slug: parts[1] as string };
}

export function assertIdStable(id: string, source: string, slug: string): void {
  const expected = `${source}/${slug}`;
  if (id !== expected) {
    throw new Error(`id "${id}" must equal "<source>/<slug>" ("${expected}")`);
  }
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
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

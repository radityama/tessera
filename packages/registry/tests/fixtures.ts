export function component() {
  return {
    schemaVersion: 1,
    id: "fixture/terminal",
    source: "fixture",
    slug: "terminal",
    name: "Terminal",
    category: "terminal",
    secondaryCategories: ["hero"],
    frameworks: ["react"],
    compatibility: {},
    visual: {
      aesthetics: ["technical"],
      tags: ["developer", "cli"],
      motion: "unknown",
      density: "unknown",
      radius: "unknown",
      surface: ["unknown"],
    },
    dependencies: [],
    dependencyStatus: "unknown",
    installation: { kind: "unknown" },
    links: { docs: "https://example.com/terminal" },
    license: { status: "unknown" },
    provenance: { adapter: "manual" },
  };
}

export function snapshot(components: unknown[] = [component()]) {
  return { schemaVersion: 1, components };
}

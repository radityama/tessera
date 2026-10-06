/**
 * Copy the pinned registry snapshot into this package so it ships with the
 * published tarball.
 *
 * The snapshots in the repository root are the source of truth; this step only
 * copies them, and fails loudly if they are missing. Without it, an installed
 * Tessera would look for a `registries/` directory next to a cloned repository
 * and find nothing — which is exactly why the CLI and MCP previously could not
 * work outside the monorepo.
 */
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(here, "..");
const repoRoot = resolve(packageRoot, "..", "..");
const sourceDir = join(repoRoot, "registries");
const targetDir = join(packageRoot, "bundled-registry");

if (!existsSync(sourceDir)) {
  console.error(
    `bundle-registry: no registry snapshot at ${sourceDir}; run \`pnpm registry:sync\``,
  );
  process.exit(1);
}

rmSync(targetDir, { recursive: true, force: true });
mkdirSync(targetDir, { recursive: true });

let sources = 0;
let components = 0;

for (const entry of readdirSync(sourceDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const from = join(sourceDir, entry.name);
  const componentsFile = join(from, "components.json");
  if (!existsSync(componentsFile)) continue;

  const parsed = JSON.parse(readFileSync(componentsFile, "utf8"));
  if (!Array.isArray(parsed) || parsed.length === 0) {
    console.error(`bundle-registry: ${entry.name}/components.json is empty`);
    process.exit(1);
  }

  cpSync(from, join(targetDir, entry.name), { recursive: true });
  sources += 1;
  components += parsed.length;
}

if (sources === 0) {
  console.error("bundle-registry: no sources found; refusing to ship an empty registry");
  process.exit(1);
}

const meta = join(sourceDir, "snapshot-meta.json");
if (existsSync(meta)) cpSync(meta, join(targetDir, "snapshot-meta.json"));

writeFileSync(
  join(targetDir, "BUNDLED.json"),
  `${JSON.stringify({ bundledFrom: "registries/", sources, components }, null, 2)}\n`,
);

console.log(`bundle-registry: ${components} components across ${sources} sources`);

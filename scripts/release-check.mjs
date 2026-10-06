/**
 * Release gate.
 *
 * One command for every safe, local check that must pass before a release. The
 * point is that cutting a release does not depend on remembering ten commands,
 * and that a check cannot be quietly skipped.
 *
 * Usage: pnpm release:check
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(repoRoot);

let failures = 0;
const ok = (m) => console.log(`  ok    ${m}`);
const bad = (m) => {
  console.error(`  FAIL  ${m}`);
  failures += 1;
};

function section(title) {
  console.log(`\n${title}`);
}

function run(command, args) {
  try {
    execFileSync(command, args, { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" });
    return true;
  } catch (err) {
    console.error(`${err.stdout ?? ""}${err.stderr ?? ""}`);
    return false;
  }
}

// -- Governance files ---------------------------------------------------------

section("Governance");

const REQUIRED_FILES = [
  "LICENSE",
  "README.md",
  "CONTRIBUTING.md",
  "CODE_OF_CONDUCT.md",
  "SECURITY.md",
  "SUPPORT.md",
  "CHANGELOG.md",
  "RELEASING.md",
  ".github/CODEOWNERS",
  ".github/PULL_REQUEST_TEMPLATE.md",
  ".github/dependabot.yml",
  ".github/ISSUE_TEMPLATE/bug_report.yml",
  ".github/ISSUE_TEMPLATE/feature_request.yml",
  ".github/ISSUE_TEMPLATE/registry_source.yml",
  "docs/integrations/compatibility.md",
  "docs/sources.md",
  "skills/tessera/SKILL.md",
];

const version = JSON.parse(
  readFileSync(join(repoRoot, "packages", "cli", "package.json"), "utf8"),
).version;
const notes = `docs/releases/v${version}.md`;
const missing = [...REQUIRED_FILES, notes].filter((f) => !existsSync(join(repoRoot, f)));
if (missing.length === 0) ok(`all ${REQUIRED_FILES.length + 1} required files present`);
else bad(`missing: ${missing.join(", ")}`);

/**
 * GitHub silently rejects an issue form whose `type` is not one of these, which
 * means the form simply never appears. Checking the literal values is worth more
 * than it looks.
 */
const ISSUE_FORM_TYPES = new Set(["markdown", "input", "textarea", "dropdown", "checkboxes"]);
const issueFormDir = join(repoRoot, ".github", "ISSUE_TEMPLATE");
let badTypes = [];
for (const file of readdirSync(issueFormDir).filter((f) => f.endsWith(".yml"))) {
  if (file === "config.yml") continue;
  const text = readFileSync(join(issueFormDir, file), "utf8");
  for (const match of text.matchAll(/^\s*-?\s*type:\s*(\S+)/gm)) {
    const value = match[1].replace(/["']/g, "");
    if (!ISSUE_FORM_TYPES.has(value)) badTypes.push(`${file}: ${value}`);
  }
}
if (badTypes.length === 0) ok("issue form element types are all supported by GitHub");
else bad(`unsupported issue form types: ${badTypes.join(", ")}`);

// -- Repository hygiene -------------------------------------------------------

section("Repository hygiene");

// Build artifacts must never be committed. One slipped in once, and nothing
// caught it: a committed tarball goes stale silently the moment source changes.
let trackedArtifacts = [];
try {
  trackedArtifacts = execFileSync("git", ["ls-files", "*.tgz", "*.tar.gz", "dist-tarballs"], {
    cwd: repoRoot,
    encoding: "utf8",
  })
    .split("\n")
    .filter(Boolean);
} catch {
  // Not a git checkout (packed tarball, shallow export) — nothing to check.
}
if (trackedArtifacts.length === 0) ok("no build artifacts tracked in git");
else bad(`build artifacts are tracked and must be removed: ${trackedArtifacts.join(", ")}`);

// -- Version consistency ------------------------------------------------------

section("Version consistency");

const PUBLISHABLE = ["registry", "core", "mcp", "cli"];
const versions = PUBLISHABLE.map((p) => ({
  pkg: p,
  version: JSON.parse(readFileSync(join(repoRoot, "packages", p, "package.json"), "utf8")).version,
}));
const distinct = [...new Set(versions.map((v) => v.version))];
if (distinct.length === 1) ok(`all publishable packages at ${distinct[0]}`);
else bad(`version drift: ${versions.map((v) => `${v.pkg}=${v.version}`).join(" ")}`);

const rootVersion = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8")).version;
if (rootVersion === distinct[0]) ok(`root package at ${rootVersion}`);
else bad(`root package is ${rootVersion}, publishable packages are ${distinct[0]}`);

// Literal versions that can drift silently if not checked.
const LITERAL_SITES = [
  ["packages/core/src/index.ts", /CORE_VERSION\s*=\s*"([^"]+)"/],
  ["packages/mcp/src/index.ts", /MCP_VERSION\s*=\s*"([^"]+)"/],
  ["packages/adapters/src/index.ts", /ADAPTERS_VERSION\s*=\s*"([^"]+)"/],
  ["packages/cli/src/cli.ts", /\.version\("([^"]+)"\)/],
];
for (const [file, pattern] of LITERAL_SITES) {
  const match = pattern.exec(readFileSync(join(repoRoot, file), "utf8"));
  if (!match) bad(`no version literal found in ${file}`);
  else if (match[1] !== distinct[0]) bad(`${file} declares ${match[1]}, expected ${distinct[0]}`);
  else ok(`${file} at ${match[1]}`);
}

// -- Workspace checks ---------------------------------------------------------

section("Workspace");

for (const [label, command, args] of [
  ["lint", "pnpm", ["lint"]],
  ["typecheck", "pnpm", ["typecheck"]],
  ["build", "pnpm", ["build"]],
  ["tests", "pnpm", ["test"]],
]) {
  if (run(command, args)) ok(label);
  else bad(label);
}

// -- Registry and packaging ---------------------------------------------------

section("Registry and packaging");

if (existsSync(join(repoRoot, "packages", "registry", "bundled-registry")))
  ok("registry bundle generated");
else bad("registry bundle missing (build did not run the bundler)");

for (const [label, args] of [
  ["MCP protocol conformance", ["mcp:conformance"]],
  ["package smoke test", ["smoke:pack"]],
]) {
  if (run("pnpm", args)) ok(label);
  else bad(label);
}

section(failures === 0 ? "Release gate passed" : `Release gate failed: ${failures} check(s)`);
process.exit(failures === 0 ? 0 : 1);

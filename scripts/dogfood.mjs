/**
 * End-to-end dogfood.
 *
 * Demonstrates the product thesis against live upstreams: search a real UI
 * library, inspect a candidate, retrieve its actual source, adapt it into a
 * throwaway project, and compile that project.
 *
 * Nothing here is faked. The component comes from the provider's registry over
 * the network, and the compile step is what proves the retrieved source is real
 * code rather than text that merely looks like it.
 *
 * Requires network. Deliberately not part of normal CI — a third party's uptime
 * must not decide whether this repository is green.
 *
 * Usage: node scripts/dogfood.mjs [<component-id>] [--keep]
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cli = join(repoRoot, "packages", "cli", "dist", "cli.js");

const args = process.argv.slice(2);
const keep = args.includes("--keep");
// magicui/terminal by default: it is the component the flagship query is meant
// to surface, it is MIT, and it declares neither npm nor registry dependencies,
// so the loop can be demonstrated end to end without hand-waving.
const componentId = args.find((a) => !a.startsWith("--")) ?? "magicui/terminal";

let failures = 0;
const step = (n, msg) => console.log(`\n[${n}] ${msg}`);
const ok = (m) => console.log(`     ok    ${m}`);
const bad = (m) => {
  console.error(`     FAIL  ${m}`);
  failures += 1;
};

function run(cmd, cmdArgs, opts = {}) {
  return execFileSync(cmd, cmdArgs, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...opts,
  });
}

if (!existsSync(cli)) {
  console.error(`dogfood: ${cli} not found; run \`pnpm build\` first`);
  process.exit(1);
}

// mkdtempSync creates the directory with mode 0700 and an unpredictable name.
// A Date.now()-derived path is guessable, and mkdirSync accepts an existing
// directory, so a local attacker could pre-seed it and capture the writes.
const workdir = mkdtempSync(join(tmpdir(), "tessera-dogfood-"));
console.log(`dogfood: component ${componentId}`);
console.log(`dogfood: workdir ${workdir}`);

try {
  mkdirSync(join(workdir, "src", "components"), { recursive: true });
  mkdirSync(join(workdir, "src", "lib"), { recursive: true });

  // 1. Search ---------------------------------------------------------------
  step(1, "search the registry for a dark technical hero");
  const query = "dark technical terminal hero for a developer CLI, subtle motion";
  const searchOut = run(process.execPath, [cli, "search", query, "--limit", "5", "--json"], {
    cwd: workdir,
  });
  const results = JSON.parse(searchOut);
  if (!Array.isArray(results) || results.length === 0) throw new Error("search returned nothing");
  ok(`${results.length} ranked results, top score ${results[0].score}`);
  if (results[0].reasons?.length) ok(`top result explains itself: ${results[0].reasons[0]}`);
  else bad("top result has no score explanation");

  const chosen = results.find((r) => r.id === componentId) ?? results[0];
  if (chosen.id !== componentId) {
    ok(`requested ${componentId} was not in the top ${results.length}; using ${chosen.id}`);
  }
  ok(`chose ${chosen.id}`);

  // 2. Inspect --------------------------------------------------------------
  step(2, "inspect the candidate before using it");
  const inspected = JSON.parse(
    run(process.execPath, [cli, "inspect", chosen.id, "--json"], { cwd: workdir }),
  );
  ok(`category ${inspected.category}, frameworks ${inspected.frameworks.join("/")}`);
  if (inspected.license.status === "known") {
    ok(
      `license ${inspected.license.identifier}, redistribution ${inspected.license.redistribution}`,
    );
  } else {
    ok("license unknown — the review step would have to escalate this");
  }
  if (inspected.provenance.upstreamName) ok(`upstream item ${inspected.provenance.upstreamName}`);
  if (inspected.provenance.derivedFields?.length) {
    ok(`declares inferred fields: ${inspected.provenance.derivedFields.join(", ")}`);
  }

  // 3. Retrieve real source -------------------------------------------------
  step(3, "retrieve the real implementation from upstream");
  const fetchOut = run(
    process.execPath,
    // Output root is `src`, not `src/components`: upstream paths already carry a
    // `components/...` or `registry/...` prefix, so nesting would produce
    // src/components/components/ui/... and break the @/* alias.
    [cli, "fetch", chosen.id, "--output", join(workdir, "src"), "--json"],
    { cwd: workdir },
  );
  const fetchResult = JSON.parse(fetchOut);
  const written = fetchResult.plan.filter((p) => p.action === "create");
  if (written.length === 0) throw new Error(`nothing was written for ${chosen.id}`);
  ok(`${written.length} file(s) written: ${written.map((w) => w.path).join(", ")}`);

  // Read the artifact again (without --output) so its contents can be inspected.
  const artifact = JSON.parse(
    run(process.execPath, [cli, "fetch", chosen.id, "--json"], { cwd: workdir }),
  );
  const totalBytes = artifact.files.reduce((n, f) => n + f.content.length, 0);
  ok(`${artifact.files.length} file(s), ${totalBytes} bytes from ${artifact.source.upstreamUrl}`);
  if (totalBytes < 500) bad(`retrieved source is suspiciously small (${totalBytes} bytes)`);

  // Content that is not real source would be a serious finding.
  const anyCode = artifact.files.some((f) =>
    /\b(import|export|function|const|return)\b/.test(f.content),
  );
  if (anyCode) ok("retrieved files contain real code, not placeholders");
  else bad("retrieved files contain no recognisable code");

  // 4. Adapt ----------------------------------------------------------------
  step(4, "adapt the retrieved source into the host project");
  // A shadcn component expects `cn` from the host's utilities. Supplying it is
  // what "adapt, don't vendor" means in practice.
  writeFileSync(
    join(workdir, "src", "lib", "utils.ts"),
    `import { clsx, type ClassValue } from "clsx";\nimport { twMerge } from "tailwind-merge";\n\nexport function cn(...inputs: ClassValue[]) {\n  return twMerge(clsx(inputs));\n}\n`,
  );
  ok("provided the host's cn() utility that the component imports");

  // Discover what the retrieved files actually import, and compare that with
  // what the registry declared. Under-reported dependencies are a real defect.
  const importedPackages = new Set();
  for (const file of artifact.files) {
    for (const match of file.content.matchAll(/from\s+["']([^"'.][^"']*)["']/g)) {
      const spec = match[1];
      if (spec.startsWith("@/") || spec.startsWith(".")) continue;
      // Scoped names contain "@", so splitting on it turns
      // "@tanstack/react-virtual" into "". Take the scope plus the package.
      const pkg = spec.startsWith("@") ? spec.split("/").slice(0, 2).join("/") : spec.split("/")[0];
      if (pkg) importedPackages.add(pkg);
    }
  }
  const declared = new Set(artifact.dependencies.map((d) => d.split("@")[0]));
  const undeclared = [...importedPackages].filter(
    (p) => !declared.has(p) && !["react", "react-dom"].includes(p),
  );
  ok(`imports: ${[...importedPackages].join(", ") || "none"}`);
  if (declared.size) ok(`registry declares: ${[...declared].join(", ")}`);
  if (undeclared.length) {
    // Reported, not failed: the registry records what the provider declares, and
    // providers routinely omit transitive imports.
    console.log(
      `     note  imports not declared in the registry: ${undeclared.join(", ")} (registry data completeness)`,
    );
  }

  // Registry dependencies are reported but NOT fetched. The shadcn CLI would
  // install them transitively; Tessera v0.1 returns only the item's own files.
  // Surfaced here because it is the most likely way an agent's first fetch
  // disappoints, and because the alternative — pulling in arbitrary transitive
  // registry items — is a bigger change than a bug fix.
  if (artifact.registryDependencies.length > 0) {
    console.log(
      `     note  this component declares registry dependencies that are NOT fetched: ${artifact.registryDependencies.join(", ")}`,
    );
    console.log(
      `     note  run \`npx shadcn@latest add ${artifact.source.upstreamUrl}\` for the full transitive install`,
    );
  } else {
    ok("self-contained: no registry dependencies to resolve");
  }

  // 5. Build the host project ----------------------------------------------
  step(5, "compile the host project containing the retrieved source");
  writeFileSync(
    join(workdir, "package.json"),
    JSON.stringify(
      {
        name: "tessera-dogfood",
        private: true,
        type: "module",
        dependencies: {
          react: "^19.0.0",
          "react-dom": "^19.0.0",
          clsx: "^2.1.1",
          "tailwind-merge": "^2.5.4",
          // react and react-dom are pinned above; letting the spread overwrite
          // them would desynchronise them from @types/react and turn a future
          // React major into a spurious dogfood failure.
          ...Object.fromEntries(
            [...importedPackages]
              .filter((p) => p !== "react" && p !== "react-dom")
              .map((p) => [p, "latest"]),
          ),
        },
        devDependencies: {
          typescript: "~5.9.2",
          "@types/react": "^19.0.0",
          "@types/react-dom": "^19.0.0",
        },
      },
      null,
      2,
    ),
  );
  writeFileSync(
    join(workdir, "tsconfig.json"),
    JSON.stringify(
      {
        compilerOptions: {
          target: "ES2022",
          lib: ["ES2022", "DOM", "DOM.Iterable"],
          jsx: "react-jsx",
          module: "ESNext",
          moduleResolution: "Bundler",
          strict: true,
          skipLibCheck: true,
          noEmit: true,
          baseUrl: ".",
          paths: { "@/*": ["./src/*"] },
        },
        include: ["src"],
      },
      null,
      2,
    ),
  );
  ok("wrote a minimal host project (react + typescript + the component's imports)");

  console.log("     ... installing dependencies (network)");
  // --ignore-scripts: these packages are chosen from live registry metadata, and
  // the install only needs their files for type-checking. Running arbitrary
  // lifecycle scripts from them would make a compromised dependency able to
  // execute code here, for no benefit.
  run("npm", ["install", "--ignore-scripts", "--no-audit", "--no-fund", "--loglevel", "error"], {
    cwd: workdir,
    stdio: "pipe",
  });
  ok("dependencies installed");

  const tsc = join(workdir, "node_modules", ".bin", "tsc");
  try {
    run(tsc, ["--noEmit", "-p", "tsconfig.json"], { cwd: workdir });
    ok("the retrieved component compiles in the host project");
  } catch (err) {
    const out = `${err.stdout ?? ""}${err.stderr ?? ""}`.split("\n").slice(0, 20).join("\n");
    bad(`the retrieved component did not compile:\n${out}`);
  }

  // 6. Summary --------------------------------------------------------------
  step(6, "summary");
  const files = [];
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) {
        if (e.name !== "node_modules") walk(p);
      } else {
        files.push(relative(workdir, p));
      }
    }
  };
  walk(join(workdir, "src"));
  console.log(`     host project: ${workdir}`);
  console.log(`     adapted files: ${files.join(", ")}`);
} catch (err) {
  bad(`unexpected error: ${err instanceof Error ? err.message : String(err)}`);
  if (err instanceof Error && err.stderr) console.error(err.stderr.toString().slice(0, 800));
} finally {
  if (keep) console.log(`\ndogfood: kept ${workdir}`);
  else rmSync(workdir, { recursive: true, force: true });
}

if (failures > 0) {
  console.error(`\ndogfood: ${failures} check(s) failed`);
  process.exit(1);
}
console.log("\ndogfood: passed — searched, retrieved, adapted and compiled real upstream source");

/**
 * Packaging smoke test.
 *
 * Builds the publishable packages, packs them into tarballs, installs those
 * tarballs into a throwaway consumer project **outside** this repository, and
 * drives the real executable and the real MCP stdio protocol from there.
 *
 * This is the check that catches "works in the monorepo, broken once installed"
 * regressions — most importantly a package that cannot find its registry data.
 *
 * Usage: node scripts/smoke-pack.mjs
 */
import { execFileSync, spawn } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLISHABLE = ["registry", "core", "mcp", "cli"];

let failures = 0;
function pass(msg) {
  console.log(`  ok    ${msg}`);
}
function fail(msg) {
  console.error(`  FAIL  ${msg}`);
  failures += 1;
}

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  });
}

/** Minimal JSON-RPC over the server's stdio, so the protocol itself is exercised. */
function mcpSession(binPath, requests, timeoutMs = 20_000) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(process.execPath, [binPath, "mcp"], { stdio: ["pipe", "pipe", "pipe"] });
    let buffer = "";
    const responses = [];
    let settled = false;
    const expectedReplies = requests.filter((r) => r.id !== undefined).length;

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        child.kill("SIGKILL");
        rejectPromise(new Error(`MCP session timed out after ${timeoutMs}ms`));
      }
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      buffer += chunk.toString("utf8");
      let index;
      while ((index = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, index).trim();
        buffer = buffer.slice(index + 1);
        if (!line) continue;
        try {
          responses.push(JSON.parse(line));
        } catch {
          // Not a protocol frame; ignore.
        }
      }
      // Notifications have no id and are never answered, so only count requests
      // that actually expect a reply.
      if (responses.length >= expectedReplies && !settled) {
        settled = true;
        clearTimeout(timer);
        child.kill();
        resolvePromise(responses);
      }
    });

    child.on("error", (err) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        rejectPromise(err);
      }
    });

    for (const request of requests) child.stdin.write(`${JSON.stringify(request)}\n`);
  });
}

const workdir = mkdtempSync(join(tmpdir(), "tessera-smoke-"));
console.log(`smoke-pack: workdir ${workdir}`);

try {
  // 1. Pack -----------------------------------------------------------------
  const tarballs = [];
  const packDir = join(workdir, "tarballs");
  mkdirSync(packDir, { recursive: true });

  for (const name of PUBLISHABLE) {
    const out = run(
      "pnpm",
      ["--filter", `@tessera-dev/${name}`, "pack", "--pack-destination", packDir],
      {
        cwd: repoRoot,
      },
    );
    const tarball = out
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.endsWith(".tgz"))
      .pop();
    if (!tarball) {
      fail(`packing @tessera-dev/${name} produced no tarball`);
      continue;
    }
    tarballs.push(tarball);
  }
  if (tarballs.length === PUBLISHABLE.length) pass(`packed ${tarballs.length} tarballs`);

  // 2. Install into a clean consumer project --------------------------------
  const consumer = join(workdir, "consumer");
  mkdirSync(consumer, { recursive: true });
  writeFileSync(
    join(consumer, "package.json"),
    JSON.stringify({ name: "consumer", private: true }, null, 2),
  );

  run("npm", ["install", "--no-audit", "--no-fund", ...tarballs], { cwd: consumer, stdio: "pipe" });
  pass("installed tarballs into a clean consumer project");

  const bin = join(consumer, "node_modules", ".bin", "tessera");

  // Proves the consumer never sees this repository's registry directory.
  const consumerRegistries = join(consumer, "registries");
  try {
    readFileSync(join(consumerRegistries, "heroui", "components.json"));
    fail("consumer unexpectedly has a registries/ directory");
  } catch {
    pass("consumer has no registries/ directory");
  }

  // 3. Drive the real executable --------------------------------------------
  const help = run(bin, ["--help"], { cwd: consumer });
  const commands = ["search", "inspect", "similar", "add", "fetch", "mcp", "doctor"];
  const missing = commands.filter((c) => !help.includes(c));
  if (missing.length === 0) pass(`help lists all commands`);
  else fail(`help is missing: ${missing.join(", ")}`);

  // A real result must name a real component id and explain its score.
  const search = run(bin, ["search", "dark technical terminal hero", "--limit", "3"], {
    cwd: consumer,
  });
  const hasIds = /\b[a-z0-9-]+\/[a-z0-9-]+\b/.test(search);
  const hasReasons = search.includes("why:");
  if (hasIds && hasReasons) pass("search returns ranked, explained components");
  else fail(`search output was not recognisable:\n${search}`);

  const doctor = run(bin, ["doctor"], { cwd: consumer });
  if (doctor.includes("registry-source: bundled")) pass("doctor reports the bundled registry");
  else fail(`doctor did not report a bundled registry:\n${doctor}`);
  if (!doctor.includes("FAIL")) pass("doctor reports no failures");
  else fail(`doctor reported failures:\n${doctor}`);

  const inspect = run(bin, ["inspect", "aceternity/terminal"], { cwd: consumer });
  if (inspect.includes("retrieval: shadcn-registry")) pass("inspect shows retrieval metadata");
  else fail(`inspect did not show retrieval metadata:\n${inspect}`);

  // Artifact availability must be answerable without the network: an npm-only
  // component reports a structured error rather than attempting a fetch.
  try {
    run(bin, ["fetch", "heroui/button", "--json"], { cwd: consumer });
    fail("fetching an npm-only component should have failed");
  } catch (err) {
    const output = `${err.stdout ?? ""}${err.stderr ?? ""}`;
    if (output.includes("artifact-unavailable")) {
      pass("fetch reports npm-only components as unavailable");
    } else {
      fail(`fetch did not report artifact-unavailable:\n${output}`);
    }
  }

  // 4. MCP over stdio -------------------------------------------------------
  const responses = await mcpSession(bin, [
    {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "smoke", version: "0" },
      },
    },
    { jsonrpc: "2.0", method: "notifications/initialized" },
    { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} },
  ]);

  const init = responses.find((r) => r.id === 1);
  if (init?.result?.serverInfo?.name === "tessera") pass("MCP initialize handshake");
  else fail(`MCP initialize failed: ${JSON.stringify(init)}`);

  const tools = responses.find((r) => r.id === 2)?.result?.tools?.map((t) => t.name) ?? [];
  const expected = [
    "search_components",
    "get_component",
    "get_component_artifact",
    "get_installation",
    "find_similar_components",
    "search_patterns",
  ];
  const missingTools = expected.filter((t) => !tools.includes(t));
  if (missingTools.length === 0) pass(`MCP exposes all ${expected.length} tools`);
  else fail(`MCP is missing tools: ${missingTools.join(", ")}`);
} catch (err) {
  fail(`unexpected error: ${String(err)}`);
} finally {
  rmSync(workdir, { recursive: true, force: true });
}

if (failures > 0) {
  console.error(`\nsmoke-pack: ${failures} check(s) failed`);
  process.exit(1);
}
console.log("\nsmoke-pack: all checks passed");

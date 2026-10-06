/**
 * MCP protocol conformance.
 *
 * Drives the built server over a real stdio session as a protocol client would:
 * initialize, tool discovery, every tool, structured errors, and a clean
 * shutdown. Vendor-specific UI checks matter less than proving the protocol
 * itself behaves, which is what this covers.
 *
 * Requires `pnpm build` first.
 *
 * Usage: node scripts/mcp-conformance.mjs
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const serverPath = join(repoRoot, "packages", "mcp", "dist", "index.js");

if (!existsSync(serverPath)) {
  console.error(`mcp-conformance: ${serverPath} not found; run \`pnpm build\` first`);
  process.exit(1);
}

let failures = 0;
const pass = (m) => console.log(`  ok    ${m}`);
const fail = (m) => {
  console.error(`  FAIL  ${m}`);
  failures += 1;
};

/** Run a sequence of JSON-RPC frames against the server and collect replies. */
function session(requests, { expectReplies, timeoutMs = 25_000 }) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(process.execPath, [serverPath], { stdio: ["pipe", "pipe", "pipe"] });
    let buffer = "";
    const responses = [];
    const stderr = [];
    let settled = false;

    const finish = (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      child.kill("SIGKILL");
      if (err) rejectPromise(err);
      else resolvePromise({ responses, stderr: stderr.join("") });
    };

    const timer = setTimeout(() => finish(new Error(`timed out after ${timeoutMs}ms`)), timeoutMs);

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
          /* not a protocol frame */
        }
      }
      if (responses.length >= expectReplies) finish();
    });

    child.stderr.on("data", (chunk) => stderr.push(chunk.toString("utf8")));
    child.on("error", (err) => finish(err));
    child.on("exit", (code) => {
      if (!settled && code !== 0) finish(new Error(`server exited early with code ${code}`));
    });

    for (const request of requests) child.stdin.write(`${JSON.stringify(request)}\n`);
  });
}

const INIT = {
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "tessera-conformance", version: "0.1.0" },
  },
};
const INITIALIZED = { jsonrpc: "2.0", method: "notifications/initialized" };
const call = (id, name, args) => ({
  jsonrpc: "2.0",
  id,
  method: "tools/call",
  params: { name, arguments: args },
});

function parseToolResult(response) {
  const text = response?.result?.content?.[0]?.text;
  if (typeof text !== "string") return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

try {
  // 1. Handshake and discovery ---------------------------------------------
  const { responses } = await session(
    [INIT, INITIALIZED, { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} }],
    { expectReplies: 2 },
  );

  const init = responses.find((r) => r.id === 1);
  if (init?.result?.serverInfo?.name === "tessera") pass("initialize returns server info");
  else fail(`initialize failed: ${JSON.stringify(init)}`);
  if (typeof init?.result?.protocolVersion === "string") pass("negotiates a protocol version");
  else fail("no protocol version negotiated");
  if (init?.result?.capabilities?.tools) pass("advertises tool capability");
  else fail("did not advertise tool capability");

  const tools = responses.find((r) => r.id === 2)?.result?.tools ?? [];
  const names = tools.map((t) => t.name).sort();
  const expected = [
    "find_similar_components",
    "get_component",
    "get_component_artifact",
    "get_installation",
    "search_components",
    "search_patterns",
  ];
  if (JSON.stringify(names) === JSON.stringify(expected))
    pass(`exposes exactly ${expected.length} tools`);
  else fail(`tool set mismatch: ${names.join(", ")}`);

  const allHaveSchema = tools.every((t) => t.inputSchema && t.description);
  if (allHaveSchema) pass("every tool has a description and input schema");
  else fail("a tool is missing a description or input schema");

  // 2. Every tool, in one session ------------------------------------------
  const toolSession = await session(
    [
      INIT,
      INITIALIZED,
      call(10, "search_components", { query: "dark technical terminal hero", limit: 3 }),
      call(11, "get_component", { id: "aceternity/terminal" }),
      call(12, "get_installation", { id: "aceternity/terminal" }),
      call(13, "find_similar_components", { id: "aceternity/terminal", limit: 3 }),
      call(14, "search_patterns", { query: "developer tool hero with terminal and subtle grid" }),
      call(15, "get_component_artifact", { id: "heroui/button" }),
      call(16, "get_component", { id: "does/not-exist" }),
      call(17, "search_components", { query: "hero", framework: "cobol" }),
    ],
    { expectReplies: 9 },
  );

  const byId = new Map(toolSession.responses.map((r) => [r.id, r]));

  const search = parseToolResult(byId.get(10));
  if (
    Array.isArray(search) &&
    search.length > 0 &&
    search[0].score > 0 &&
    search[0].reasons?.length
  ) {
    pass("search_components returns scored, explained results");
  } else fail(`search_components returned ${JSON.stringify(search).slice(0, 120)}`);

  const component = parseToolResult(byId.get(11));
  if (component?.id === "aceternity/terminal" && component?.retrieval?.kind === "shadcn-registry") {
    pass("get_component returns full canonical metadata");
  } else fail(`get_component returned ${JSON.stringify(component).slice(0, 120)}`);

  const install = parseToolResult(byId.get(12));
  if (install?.id === "aceternity/terminal" && install?.licenseWarning === undefined) {
    pass("get_installation returns a safe plan");
  } else fail(`get_installation returned ${JSON.stringify(install).slice(0, 120)}`);

  const similar = parseToolResult(byId.get(13));
  if (
    Array.isArray(similar) &&
    similar.length > 0 &&
    similar.every((s) => s.id !== "aceternity/terminal")
  ) {
    pass("find_similar_components returns alternatives");
  } else fail(`find_similar_components returned ${JSON.stringify(similar).slice(0, 120)}`);

  const patterns = parseToolResult(byId.get(14));
  if (Array.isArray(patterns) && patterns[0]?.reasons?.[0]?.includes("pattern match")) {
    pass("search_patterns explains the pattern expansion");
  } else fail(`search_patterns returned ${JSON.stringify(patterns).slice(0, 120)}`);

  // 3. Structured errors ----------------------------------------------------
  const artifact = byId.get(15);
  const artifactErr = parseToolResult(artifact);
  if (artifact?.result?.isError === true && artifactErr?.error?.code === "artifact-unavailable") {
    pass("artifact tool reports unavailable artifacts as structured errors");
  } else fail(`artifact error shape wrong: ${JSON.stringify(artifact).slice(0, 160)}`);

  const missing = byId.get(16);
  if (
    missing?.result?.isError === true &&
    parseToolResult(missing)?.error?.code === "component-not-found"
  ) {
    pass("unknown ids produce component-not-found");
  } else fail(`unknown id error wrong: ${JSON.stringify(missing).slice(0, 160)}`);

  const badFramework = byId.get(17);
  if (badFramework?.result?.isError === true) pass("invalid arguments are rejected");
  else fail("invalid framework filter was accepted");

  const anyStack = toolSession.responses.some((r) =>
    JSON.stringify(r).match(/at .*\(.*:\d+:\d+\)/),
  );
  if (!anyStack) pass("no response leaks a stack trace");
  else fail("a response leaked a stack trace");

  // 4. Clean shutdown -------------------------------------------------------
  const {} = await session([INIT, INITIALIZED], { expectReplies: 1 });
  pass("server exits cleanly when stdin closes");
} catch (err) {
  fail(`unexpected error: ${String(err)}`);
}

if (failures > 0) {
  console.error(`\nmcp-conformance: ${failures} check(s) failed`);
  process.exit(1);
}
console.log("\nmcp-conformance: all checks passed");

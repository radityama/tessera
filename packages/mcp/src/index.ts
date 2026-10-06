import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { discoverRegistryFiles, loadRegistryFiles } from "@tessera/registry";
import { createServer } from "./server.js";

export const MCP_VERSION = "0.1.0";
export * from "./server.js";

function resolveRegistriesDir(): string {
  const env = process.env["TESSERA_REGISTRIES"];
  if (env && existsSync(env)) return resolve(env);
  const cwd = process.cwd();
  for (let i = 0; i <= 5; i++) {
    const candidate =
      i === 0 ? join(cwd, "registries") : join(cwd, ...Array(i).fill(".."), "registries");
    if (existsSync(candidate)) return resolve(candidate);
  }
  const here = dirname(fileURLToPath(import.meta.url));
  return resolve(here, "..", "..", "..", "registries");
}

export async function runStdio(): Promise<void> {
  const files = discoverRegistryFiles(resolveRegistriesDir());
  const components = loadRegistryFiles(files);
  const server = createServer(components);
  await server.connect(new StdioServerTransport());
}

const invokedAsServer =
  typeof process.argv[1] === "string" &&
  (process.argv[1].endsWith("/index.js") || process.argv[1].endsWith("mcp"));
if (invokedAsServer && !process.env["VITEST"]) {
  runStdio().catch((err) => {
    console.error(JSON.stringify({ error: { code: "startup-error", message: String(err) } }));
    process.exit(1);
  });
}

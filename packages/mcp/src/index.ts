import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadDefaultRegistry } from "@tessera-dev/registry";
import { createServer } from "./server.js";

export const MCP_VERSION = "0.1.0";
export * from "./server.js";

/**
 * Start the MCP server over stdio.
 *
 * Registry resolution lives in `@tessera-dev/registry` so the CLI and this server
 * cannot disagree about which snapshot is active.
 */
export async function runStdio(): Promise<void> {
  const components = loadDefaultRegistry();
  const server = createServer(components);
  await server.connect(new StdioServerTransport());
}

const invokedAsServer =
  typeof process.argv[1] === "string" &&
  (process.argv[1].endsWith("/index.js") || process.argv[1].endsWith("tessera-mcp"));
if (invokedAsServer && !process.env["VITEST"]) {
  runStdio().catch((err) => {
    console.error(JSON.stringify({ error: { code: "startup-error", message: String(err) } }));
    process.exit(1);
  });
}

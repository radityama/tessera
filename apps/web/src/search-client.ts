/**
 * The explorer's search, in the browser.
 *
 * This re-exports the same function the CLI and MCP call. The explorer does not
 * have its own ranking: an earlier version filtered with `String.includes` over
 * the rendered text, which meant "search" on the website and "search" in the
 * CLI were different features that happened to share a name.
 *
 * Imported through the `./search` subpath so the browser bundle does not pull in
 * artifact retrieval and its dependencies, none of which apply in a page.
 */
export { searchRegistry, findSimilar, searchPatterns } from "@tessera-dev/core/search";
export type { RankedResult, SearchOptions } from "@tessera-dev/core/search";

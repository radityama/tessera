# Beautiful UI registry

Four reviewed metadata entries from the [official catalog](https://www.beautifului.dev/) live in the [canonical snapshot](../../packages/registry/src/data/registry.json). Review date: 2026-10-05. The catalog uses same-page links; the actual `#search`, `#code-block`, `#records-table`, and `#prompt-bar` URLs were verified rather than inventing separate documentation routes.

| ID and verified page                                                    | Curator annotations and basis                                                                                            |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| [beautifului/search](https://www.beautifului.dev/#search)               | `command-menu`; search/filter/empty-state tags describe its documented command-search behavior                           |
| [beautifului/code-block](https://www.beautifului.dev/#code-block)       | `other` because no code-listing category exists; code/diff/line-numbers tags describe the catalog's two display variants |
| [beautifului/records-table](https://www.beautifului.dev/#records-table) | `table`; records/data tags identify tabular record display                                                               |
| [beautifului/prompt-bar](https://www.beautifului.dev/#prompt-bar)       | `form`; composer/commands/sources tags identify prompt input controls                                                    |

The [official license page](https://www.beautifului.dev/license), linked directly from the catalog, states MIT and includes the complete license text and copyright notice. These records have `license.status: "known"`, identifier `MIT`, and that evidence URL. This metadata does not remove obligations to preserve applicable notices.

The bounded catalog does not establish a transferable implementation framework or installation command. `frameworks: ["other"]` is the unverified-framework catchall, not a React claim. Installation kind is `manual` with an upstream URL so the consumer can establish distribution and prerequisites. `beautifului/terminal-hero` from the scaffold is not a verified entry and is not indexed.

Dependency knowledge is incomplete: `dependencies: []` and `dependencyStatus: "unknown"` do not claim a dependency-free component. Compatibility booleans are absent, visual scales/surfaces are unknown, and aesthetics are unannotated. Category and functional tags are curator judgments about catalog roles. Provenance is `manual` with a UTC review timestamp; only catalog/license metadata is stored, with no upstream source or demo content.

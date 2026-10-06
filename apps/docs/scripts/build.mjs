import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..", "..", "..");
const outDir = join(here, "..", "dist");

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ponytail: naive markdown renderer (headings, code, lists, links, paragraphs).
// Upgrade to a real md library only if docs rendering needs grow.
function md(src) {
  const lines = src.split("\n");
  let html = "";
  let inCode = false;
  let inList = false;
  for (const line of lines) {
    if (line.startsWith("```")) {
      html += inCode ? "</code></pre>" : "<pre><code>";
      inCode = !inCode;
      continue;
    }
    if (inCode) {
      html += `${esc(line)}\n`;
      continue;
    }
    const h = line.match(/^(#{1,4})\s+(.*)/);
    if (h) {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      const level = h[1].length;
      html += `<h${level}>${inline(h[2])}</h${level}>`;
      continue;
    }
    if (/^\s*[-*]\s+/.test(line)) {
      if (!inList) {
        html += "<ul>";
        inList = true;
      }
      html += `<li>${inline(line.replace(/^\s*[-*]\s+/, ""))}</li>`;
      continue;
    }
    if (inList && line.trim() === "") {
      html += "</ul>";
      inList = false;
      continue;
    }
    if (line.trim() === "") continue;
    html += `<p>${inline(line)}</p>`;
  }
  if (inList) html += "</ul>";
  if (inCode) html += "</code></pre>";
  return html;
}

function inline(s) {
  let out = esc(s);
  out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  return out;
}

const pages = [
  { file: "index.html", title: "concept", src: ["docs/product-spec.md", "docs/roadmap.md"] },
  { file: "architecture.html", title: "architecture", src: ["docs/architecture.md"] },
  { file: "registry-schema.html", title: "registry schema", src: ["docs/component-model.md"] },
  { file: "cli.html", title: "CLI", src: ["docs/cli.md"] },
  { file: "mcp.html", title: "MCP", src: ["docs/mcp.md"] },
  { file: "skill.html", title: "skill integration", src: ["skills/tessera/SKILL.md"] },
  {
    file: "adding-a-registry-source.html",
    title: "adding a registry source",
    src: ["docs/registry-ingestion.md"],
  },
  { file: "licensing.html", title: "licensing model", src: ["docs/security-licensing.md"] },
  { file: "contributing.html", title: "contributing", src: ["CONTRIBUTING.md"] },
  { file: "search-ranking.html", title: "search and ranking", src: ["docs/search-ranking.md"] },
  { file: "testing.html", title: "testing", src: ["docs/testing.md"] },
];

function shell(title, body, nav) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} — tessera docs</title><style>body{font-family:system-ui,sans-serif;max-width:860px;margin:2rem auto;padding:0 1rem;line-height:1.6}nav a{margin-right:.75rem}pre{background:#f5f5f5;padding:1rem;overflow:auto}code{background:#f0f0f0}</style></head><body><nav>${nav}</nav><main>${body}</main></body></html>`;
}

mkdirSync(outDir, { recursive: true });
const nav = pages.map((p) => `<a href="./${p.file}">${esc(p.title)}</a>`).join("");
for (const page of pages) {
  const body = page.src
    .map((rel) => {
      try {
        return md(readFileSync(join(root, rel), "utf8"));
      } catch {
        return `<p>missing: ${esc(rel)}</p>`;
      }
    })
    .join("\n<hr>\n");
  writeFileSync(join(outDir, page.file), shell(page.title, body, nav));
}
console.log(`docs build ok (${pages.length} pages)`);

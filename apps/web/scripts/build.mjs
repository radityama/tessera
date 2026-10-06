import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { searchRegistry } from "@tessera-dev/core/search";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..", "..", "..");
const registriesDir = join(root, "registries");
const outDir = join(here, "..", "dist");

/**
 * The explorer consumes the same registry snapshot and the same search core as
 * the CLI and MCP. It has no ranking of its own.
 */
function loadAll() {
  const all = [];
  if (!existsSync(registriesDir)) return all;
  for (const entry of readdirSync(registriesDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const file = join(registriesDir, entry.name, "components.json");
    if (!existsSync(file)) continue;
    all.push(...JSON.parse(readFileSync(file, "utf8")));
  }
  return all.sort((a, b) => (a.id < b.id ? -1 : 1));
}

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Distinguishes what a visitor can actually do with a component. */
function availability(c) {
  const fetchable = c.retrieval.kind === "shadcn-registry" || c.retrieval.kind === "raw-source";
  if (fetchable) return { label: "artifact retrievable", cls: "yes" };
  if (c.retrieval.kind === "npm-package") return { label: "package install", cls: "pkg" };
  if (c.retrieval.kind === "none") return { label: "metadata only", cls: "no" };
  return { label: "manual retrieval", cls: "no" };
}

function licenseLabel(c) {
  if (c.license.status === "unknown") return { label: "license unknown", cls: "warn" };
  const parts = [c.license.identifier];
  if (c.license.redistribution === "restricted") {
    return { label: `${parts[0]} · redistribution restricted`, cls: "warn" };
  }
  if (c.license.osiApproved === false)
    return { label: `${parts[0]} · not OSI-approved`, cls: "warn" };
  return { label: parts[0], cls: "yes" };
}

const STYLE = `
:root{color-scheme:dark}
*{box-sizing:border-box}
body{margin:0;background:#0b0b0d;color:#e8e8ea;font:15px/1.55 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}
a{color:#8ab4ff;text-decoration:none}
a:hover{text-decoration:underline}
.wrap{max-width:1040px;margin:0 auto;padding:24px 20px 64px}
header{border-bottom:1px solid #232327;padding:16px 20px;background:#0e0e11}
header .wrap{padding:0;display:flex;gap:18px;align-items:baseline;flex-wrap:wrap}
header strong{font-weight:650;letter-spacing:-.01em}
header nav a{margin-right:14px;color:#a9a9b2}
h1{font-size:24px;letter-spacing:-.02em;margin:28px 0 6px}
h2{font-size:17px;margin:28px 0 8px;letter-spacing:-.01em}
p.sub{color:#9a9aa4;margin:0 0 20px}
form.filters{display:flex;flex-wrap:wrap;gap:8px;margin:18px 0}
input,select{font:inherit;background:#16161a;color:inherit;border:1px solid #2c2c33;border-radius:7px;padding:8px 10px;min-height:40px}
input{flex:1 1 320px;min-width:220px}
.card{border:1px solid #232327;border-radius:10px;padding:14px 16px;margin:10px 0;background:#121215}
.card h3{margin:0 0 4px;font-size:15px}
.meta{color:#9a9aa4;font-size:13px;margin:2px 0}
.tags{color:#7f7f8a;font-size:12px;margin-top:6px;word-break:break-word}
.why{color:#b9b9c2;font-size:13px;margin-top:8px;border-left:2px solid #2c2c33;padding-left:10px}
.score{float:right;font-variant-numeric:tabular-nums;color:#d7d7de;font-weight:600}
.badge{display:inline-block;font-size:11px;padding:1px 7px;border-radius:99px;border:1px solid #2c2c33;margin-right:6px;color:#b9b9c2}
.badge.yes{border-color:#2f5d3f;color:#8fd6a4}
.badge.warn{border-color:#5d5030;color:#e2c777}
.badge.pkg{border-color:#31465d;color:#8fbde0}
.badge.no{border-color:#3a3a42;color:#8a8a94}
table{border-collapse:collapse;width:100%;font-size:14px;margin:8px 0}
th,td{text-align:left;padding:7px 10px;border-bottom:1px solid #232327;vertical-align:top}
th{color:#9a9aa4;font-weight:600}
code{background:#1a1a1f;border:1px solid #2c2c33;border-radius:5px;padding:1px 5px;font-size:13px}
pre{background:#121215;border:1px solid #232327;border-radius:9px;padding:12px;overflow:auto;font-size:13px}
.count{color:#7f7f8a;font-size:13px}
footer{border-top:1px solid #232327;margin-top:40px;padding-top:16px;color:#7f7f8a;font-size:13px}
`;

function shell(title, body, extraHead = "") {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} — Tessera</title><style>${STYLE}</style>${extraHead}</head>
<body><header><div class="wrap"><strong><a href="./index.html">tessera</a></strong>
<nav><a href="./sources.html">sources</a><a href="./categories.html">categories</a>
<a href="https://github.com/radityama/tessera">repo</a></nav>
<span class="count">registry explorer</span></div></header><main class="wrap">${body}</main></body></html>`;
}

function card(c) {
  const avail = availability(c);
  const lic = licenseLabel(c);
  return `<div class="card">
<h3><a href="./component-${esc(c.source)}-${esc(c.slug)}.html">${esc(c.id)}</a> — ${esc(c.name)}</h3>
<p class="meta">${esc(c.category)} · ${esc(c.source)} · ${esc(c.frameworks.join("/"))} · motion ${esc(c.visual.motion)} · ${c.dependencies.filter((d) => d.required).length} required deps</p>
<p class="meta"><span class="badge ${avail.cls}">${esc(avail.label)}</span><span class="badge ${lic.cls}">${esc(lic.label)}</span></p>
<p class="meta">${esc(c.description ?? "")}</p></div>`;
}

function detailPage(c) {
  const avail = availability(c);
  const lic = licenseLabel(c);
  const retrieval =
    c.retrieval.kind === "shadcn-registry"
      ? `<code>${esc(c.retrieval.itemUrl)}</code>`
      : c.retrieval.kind === "npm-package"
        ? `<code>${esc(c.retrieval.package)}</code>`
        : esc(c.retrieval.kind);

  const upstream = [c.links.homepage, c.links.docs]
    .filter(Boolean)
    .map((u) => `<a href="${esc(u)}">${esc(u)}</a>`)
    .join(" · ");

  const explain = searchRegistry([c], { query: c.name, limit: 1 })[0];

  return shell(
    c.id,
    `<h1>${esc(c.id)}</h1><p class="sub">${esc(c.name)}</p>
<p><span class="badge ${avail.cls}">${esc(avail.label)}</span><span class="badge ${lic.cls}">${esc(lic.label)}</span></p>
${c.description ? `<p>${esc(c.description)}</p>` : ""}
<h2>Metadata</h2>
<table>
<tr><th>category</th><td>${esc(c.category)}${c.secondaryCategories.length ? ` (also: ${esc(c.secondaryCategories.join(", "))})` : ""}</td></tr>
<tr><th>frameworks</th><td>${esc(c.frameworks.join(", "))}</td></tr>
<tr><th>visual</th><td>aesthetics: ${esc(c.visual.aesthetics.join(", ") || "—")}<br>tags: ${esc(c.visual.tags.join(", ") || "—")}<br>motion: ${esc(c.visual.motion)} · density: ${esc(c.visual.density)} · radius: ${esc(c.visual.radius)}</td></tr>
<tr><th>dependencies</th><td>${esc(c.dependencies.map((d) => d.name).join(", ") || "none")}</td></tr>
</table>
<h2>Retrieval</h2>
<p>${retrieval}</p>
${c.retrieval.installCommand ? `<pre>${esc(c.retrieval.installCommand)}</pre>` : ""}
${avail.cls === "yes" ? `<pre>tessera fetch ${esc(c.id)} --dry-run</pre>` : `<p class="meta">No artifact is retrievable for this component; the metadata above is all Tessera can offer.</p>`}
<h2>License</h2>
<p>${esc(lic.label)}${c.license.notes ? `<br><span class="meta">${esc(c.license.notes)}</span>` : ""}</p>
${c.license.source ? `<p class="meta">evidence: <a href="${esc(c.license.source)}">${esc(c.license.source)}</a>${c.license.verifiedAt ? ` · verified ${esc(c.license.verifiedAt.slice(0, 10))}` : ""}</p>` : ""}
<h2>Upstream</h2>
<p>${upstream || "—"}</p>
<h2>Provenance</h2>
<p class="meta">adapter <code>${esc(c.provenance.adapter)}</code>${c.provenance.upstreamName ? ` · upstream item <code>${esc(c.provenance.upstreamName)}</code>` : ""}${c.provenance.retrievedAt ? ` · retrieved ${esc(c.provenance.retrievedAt.slice(0, 10))}` : ""}</p>
${c.provenance.derivedFields.length ? `<p class="meta">Inferred by Tessera rather than read from upstream: ${esc(c.provenance.derivedFields.join(", "))}. Everything else above is an upstream fact.</p>` : ""}
${explain ? `<h2>Why it ranks</h2><div class="why">${esc(explain.reasons.join("; "))}</div>` : ""}
<p><a href="./index.html">← back to search</a></p>`,
  );
}

const all = loadAll();
const sources = [...new Set(all.map((c) => c.source))].sort();
const categories = [...new Set(all.map((c) => c.category))].sort();

mkdirSync(outDir, { recursive: true });

// Bundle the real ranking code for the browser, straight from @tessera-dev/core.
await build({
  entryPoints: [join(here, "..", "src", "search-client.ts")],
  outfile: join(outDir, "search.js"),
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
  minify: true,
  logLevel: "warning",
});

writeFileSync(join(outDir, "data.json"), `${JSON.stringify(all, null, 2)}\n`);

const searchForm = `<form class="filters" onsubmit="return false">
<input id="q" type="search" placeholder="e.g. dark technical terminal hero" aria-label="search">
<select id="f-source" aria-label="source"><option value="">all sources</option>${sources.map((s) => `<option>${esc(s)}</option>`).join("")}</select>
<select id="f-category" aria-label="category"><option value="">all categories</option>${categories.map((s) => `<option>${esc(s)}</option>`).join("")}</select>
<select id="f-framework" aria-label="framework"><option value="">any framework</option>${[
  ...new Set(all.flatMap((c) => c.frameworks)),
]
  .sort()
  .map((f) => `<option>${esc(f)}</option>`)
  .join("")}</select>
<select id="f-motion" aria-label="motion"><option value="">any motion</option><option>none</option><option>low</option><option>medium</option><option>high</option><option>unknown</option></select>
<select id="f-artifact" aria-label="artifact"><option value="">any availability</option><option value="yes">artifact retrievable</option><option value="no">not retrievable</option></select>
</form>`;

const indexBody = `<h1>Registry explorer</h1>
<p class="sub">${all.length} components from ${sources.length} sources. Search here runs the same
ranking code as the CLI and MCP — not a separate filter.</p>
${searchForm}
<div id="status" class="count"></div>
<div id="results"></div>
<script type="module">
import { searchRegistry } from "./search.js";
import { esc, availability, licenseLabel, cardHtml } from "./render.js";
const components = await (await fetch("./data.json")).json();
const q = document.getElementById("q"), status = document.getElementById("status"), out = document.getElementById("results");
const fSource = document.getElementById("f-source"), fCat = document.getElementById("f-category"),
      fFw = document.getElementById("f-framework"), fMotion = document.getElementById("f-motion"),
      fArtifact = document.getElementById("f-artifact");
function render() {
  const query = q.value.trim();
  let rows;
  if (!query && !fSource.value && !fCat.value && !fFw.value && !fMotion.value) {
    rows = components.map((component) => ({ component, score: null, reasons: [] }));
  } else {
    rows = searchRegistry(components, {
      query,
      limit: 50,
      ...(fSource.value ? { source: fSource.value } : {}),
      ...(fCat.value ? { category: fCat.value } : {}),
      ...(fFw.value ? { framework: fFw.value } : {}),
      ...(fMotion.value ? { motion: fMotion.value } : {}),
    });
  }
  if (fArtifact.value) {
    rows = rows.filter(({ component }) => {
      const yes = component.retrieval.kind === "shadcn-registry" || component.retrieval.kind === "raw-source";
      return fArtifact.value === "yes" ? yes : !yes;
    });
  }
  status.textContent = rows.length + " result" + (rows.length === 1 ? "" : "s") + (query ? " for \\"" + query + "\\"" : "");
  out.innerHTML = rows.length
    ? rows.map((r) => cardHtml(r.component, r.score, r.reasons)).join("")
    : '<p class="count">No components match. Try a broader query or clear a filter.</p>';
}
for (const el of [q, fSource, fCat, fFw, fMotion, fArtifact]) el.addEventListener("input", render);
render();
</script>`;

writeFileSync(join(outDir, "index.html"), shell("search", indexBody));

// A small client module so the page script stays readable and escaping lives in one place.
writeFileSync(
  join(outDir, "render.js"),
  `export function esc(s){return String(s??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}
export function availability(c){
  if(c.retrieval.kind==="shadcn-registry"||c.retrieval.kind==="raw-source")return{label:"artifact retrievable",cls:"yes"};
  if(c.retrieval.kind==="npm-package")return{label:"package install",cls:"pkg"};
  if(c.retrieval.kind==="none")return{label:"metadata only",cls:"no"};
  return{label:"manual retrieval",cls:"no"};
}
export function licenseLabel(c){
  if(c.license.status==="unknown")return{label:"license unknown",cls:"warn"};
  if(c.license.redistribution==="restricted")return{label:c.license.identifier+" · redistribution restricted",cls:"warn"};
  if(c.license.osiApproved===false)return{label:c.license.identifier+" · not OSI-approved",cls:"warn"};
  return{label:c.license.identifier,cls:"yes"};
}
export function cardHtml(c,score,reasons){
  const a=availability(c),l=licenseLabel(c);
  const deps=c.dependencies.filter(d=>d.required).length;
  return '<div class="card"><h3><a href="./component-'+esc(c.source)+'-'+esc(c.slug)+'.html">'+esc(c.id)+'</a> — '+esc(c.name)+
    (score===null?'':'<span class="score">'+score.toFixed(3)+'</span>')+'</h3>'+
    '<p class="meta">'+esc(c.category)+' · '+esc(c.source)+' · '+esc(c.frameworks.join("/"))+' · motion '+esc(c.visual.motion)+' · '+deps+' required deps</p>'+
    '<p class="meta"><span class="badge '+a.cls+'">'+esc(a.label)+'</span><span class="badge '+l.cls+'">'+esc(l.label)+'</span></p>'+
    (c.description?'<p class="meta">'+esc(c.description)+'</p>':'')+
    (reasons&&reasons.length?'<div class="why">'+esc(reasons.join("; "))+'</div>':'')+'</div>';
}
`,
);

for (const c of all) {
  writeFileSync(join(outDir, `component-${c.source}-${c.slug}.html`), detailPage(c));
}

writeFileSync(
  join(outDir, "sources.html"),
  shell(
    "sources",
    `<h1>Sources</h1><p class="sub">Every snapshot is generated from the provider's own registry.
See <a href="https://github.com/radityama/tessera/blob/main/docs/sources.md">docs/sources.md</a> for licence evidence.</p>
${sources
  .map((s) => {
    const list = all.filter((c) => c.source === s);
    const fetchable = list.filter((c) => availability(c).cls === "yes").length;
    return `<div class="card"><h3><a href="./source-${esc(s)}.html">${esc(s)}</a></h3><p class="meta">${list.length} components · ${fetchable} with a retrievable artifact</p></div>`;
  })
  .join("")}`,
  ),
);

for (const s of sources) {
  writeFileSync(
    join(outDir, `source-${s}.html`),
    shell(
      `source: ${s}`,
      `<h1>${esc(s)}</h1><p class="sub">${all.filter((c) => c.source === s).length} components</p>
${all
  .filter((c) => c.source === s)
  .map(card)
  .join("")}
<p><a href="./sources.html">← all sources</a></p>`,
    ),
  );
}

writeFileSync(
  join(outDir, "categories.html"),
  shell(
    "categories",
    `<h1>Categories</h1>
${categories
  .map(
    (cat) =>
      `<div class="card"><h3><a href="./category-${esc(cat)}.html">${esc(cat)}</a></h3><p class="meta">${all.filter((c) => c.category === cat).length} components</p></div>`,
  )
  .join("")}`,
  ),
);

for (const cat of categories) {
  writeFileSync(
    join(outDir, `category-${cat}.html`),
    shell(
      `category: ${cat}`,
      `<h1>${esc(cat)}</h1><p class="sub">${all.filter((c) => c.category === cat).length} components</p>
${all
  .filter((c) => c.category === cat)
  .map(card)
  .join("")}
<p><a href="./categories.html">← all categories</a></p>`,
    ),
  );
}

console.log(
  `web build ok (${all.length} components, ${sources.length} sources, ${categories.length} categories)`,
);

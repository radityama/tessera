import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..", "..", "..");
const registriesDir = join(root, "registries");
const outDir = join(here, "..", "dist");

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

function shell(title, body) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} — tessera</title><style>body{font-family:system-ui,sans-serif;max-width:960px;margin:2rem auto;padding:0 1rem;line-height:1.5}header nav a{margin-right:1rem}.card{border:1px solid #ddd;border-radius:8px;padding:1rem;margin:1rem 0}form.filters{display:flex;flex-wrap:wrap;gap:.5rem;margin:1rem 0}input,select{font-size:16px;padding:.4rem .6rem;min-height:44px}</style></head><body><header><nav><a href="./index.html">home</a><a href="./sources.html">sources</a><a href="./categories.html">categories</a></nav></header><main>${body}</main></body></html>`;
}

function card(c) {
  const file = `./component-${c.source}-${c.slug}.html`;
  return `<div class="card" data-source="${esc(c.source)}" data-category="${esc(c.category)}" data-motion="${esc(c.visual.motion)}" data-frameworks="${esc(c.frameworks.join(","))}" data-deps="${c.dependencies.filter((d) => d.required).length}" data-tags="${esc([...c.visual.aesthetics, ...c.visual.tags].join(" ").toLowerCase())}"><a href="${file}"><strong>${esc(c.id)}</strong> — ${esc(c.name)}</a><br>category: ${esc(c.category)} | frameworks: ${esc(c.frameworks.join("/"))} | motion: ${esc(c.visual.motion)} | deps: ${c.dependencies.filter((d) => d.required).length} | license: ${esc(c.license.status)}<br><small>${esc(c.description ?? "")}</small></div>`;
}

function detailPage(c) {
  return shell(
    c.id,
    `<h1>${esc(c.id)}</h1><p>${esc(c.description ?? "")}</p><div class="card"><p>source: ${esc(c.source)} | category: ${esc(c.category)} (${esc(c.secondaryCategories.join(", ") || "—")})</p><p>frameworks: ${esc(c.frameworks.join(", "))}</p><p>aesthetics: ${esc(c.visual.aesthetics.join(", "))} | tags: ${esc(c.visual.tags.join(", "))} | motion: ${esc(c.visual.motion)} | density: ${esc(c.visual.density)}</p><p>dependencies: ${esc(c.dependencies.map((d) => d.name).join(", ") || "none")}</p><p>installation: ${esc(c.installation.kind)} ${esc(c.installation.command ?? "")} ${esc(c.installation.instructions ?? "")}</p><p>license: ${esc(c.license.status)} ${esc(c.license.identifier ?? "")} ${esc(c.license.notes ?? "")}</p><p><a href="./index.html">back to search</a></p></div>`,
  );
}

const all = loadAll();
const sources = [...new Set(all.map((c) => c.source))].sort();
const categories = [...new Set(all.map((c) => c.category))].sort();

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "data.json"), JSON.stringify(all, null, 2));

const indexBody = `<h1>tessera registry explorer</h1><p>${all.length} curated components from ${sources.length} sources. Same registry snapshot as the CLI/MCP.</p><form class="filters" onsubmit="return false"><input id="q" type="search" placeholder="search, e.g. dark terminal hero…" aria-label="search"><select id="f-source" aria-label="source"><option value="">all sources</option>${sources.map((s) => `<option>${esc(s)}</option>`).join("")}</select><select id="f-category" aria-label="category"><option value="">all categories</option>${categories.map((s) => `<option>${esc(s)}</option>`).join("")}</select><select id="f-framework" aria-label="framework"><option value="">any framework</option><option>react</option><option>vue</option><option>svelte</option><option>html</option><option>other</option></select><select id="f-motion" aria-label="motion"><option value="">any motion</option><option>none</option><option>low</option><option>medium</option><option>high</option></select><select id="f-deps" aria-label="dependencies"><option value="">any deps</option><option value="0">0 required</option><option value="1">≤1 required</option><option value="2">≤2 required</option></select></form><div id="results">${all.map(card).join("")}</div><script>const q=document.getElementById('q'),fs=document.getElementById('f-source'),fc=document.getElementById('f-category'),ff=document.getElementById('f-framework'),fm=document.getElementById('f-motion'),fd=document.getElementById('f-deps');function apply(){const term=q.value.toLowerCase();document.querySelectorAll('#results .card').forEach(el=>{const hay=el.textContent.toLowerCase();const okQ=!term||term.split(/\\s+/).every(t=>hay.includes(t));const okS=!fs.value||el.dataset.source===fs.value;const okC=!fc.value||el.dataset.category===fc.value;const okF=!ff.value||el.dataset.frameworks.split(',').includes(ff.value);const okM=!fm.value||el.dataset.motion===fm.value;const okD=!fd.value||Number(el.dataset.deps)<=Number(fd.value);el.style.display=okQ&&okS&&okC&&okF&&okM&&okD?'':'none';});}[q,fs,fc,ff,fm,fd].forEach(el=>el.addEventListener('input',apply));</script>`;
writeFileSync(join(outDir, "index.html"), shell("home / search", indexBody));

for (const c of all) {
  writeFileSync(join(outDir, `component-${c.source}-${c.slug}.html`), detailPage(c));
}
writeFileSync(
  join(outDir, "sources.html"),
  shell(
    "sources",
    `<h1>sources</h1>${sources.map((s) => `<div class="card"><a href="./source-${esc(s)}.html"><strong>${esc(s)}</strong></a> — ${all.filter((c) => c.source === s).length} components</div>`).join("")}`,
  ),
);
for (const s of sources) {
  writeFileSync(
    join(outDir, `source-${s}.html`),
    shell(
      `source: ${s}`,
      `<h1>source: ${esc(s)}</h1>${all
        .filter((c) => c.source === s)
        .map(card)
        .join("")}<p><a href="./sources.html">all sources</a></p>`,
    ),
  );
}
writeFileSync(
  join(outDir, "categories.html"),
  shell(
    "categories",
    `<h1>categories</h1>${categories.map((s) => `<div class="card"><a href="./category-${esc(s)}.html"><strong>${esc(s)}</strong></a> — ${all.filter((c) => c.category === s).length} components</div>`).join("")}`,
  ),
);
for (const cat of categories) {
  writeFileSync(
    join(outDir, `category-${cat}.html`),
    shell(
      `category: ${cat}`,
      `<h1>category: ${esc(cat)}</h1>${all
        .filter((c) => c.category === cat)
        .map(card)
        .join("")}<p><a href="./categories.html">all categories</a></p>`,
    ),
  );
}

console.log(
  `web build ok (${all.length} components, ${sources.length} sources, ${categories.length} categories)`,
);

/**
 * Exports a static, script-free preview of the running site for sharing (for example as a hosted artifact).
 * Crawls every internal page from BASE, rewrites links to relative index.html paths, resolves /out/ shopping links
 * to their current retailer destination, and copies CSS and fonts. Client JavaScript is removed except a tiny
 * search script, so the preview works on any static host. The real site should be deployed with `next start` or Vercel.
 *   BASE=http://localhost:3000 OUT=preview node scripts/export-preview.mjs
 */
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE || "http://localhost:3000";
const OUT = process.env.OUT || "preview";
fs.rmSync(OUT, { recursive: true, force: true });

const pages = new Map();
const queue = ["/", "/search/"];
const outCache = new Map();
const assets = new Set();

async function resolveOut(href) {
  if (!outCache.has(href)) {
    const r = await fetch(BASE + href, { redirect: "manual" });
    outCache.set(href, r.headers.get("location") || "#");
  }
  return outCache.get(href);
}

while (queue.length) {
  const p = queue.shift();
  if (pages.has(p)) continue;
  const r = await fetch(BASE + p);
  if (r.status !== 200) { console.warn("skip", p, r.status); pages.set(p, null); continue; }
  const html = await r.text();
  pages.set(p, html);
  for (const m of html.matchAll(/href="(\/[^"#?]*)/g)) {
    const h = m[1];
    if (h.startsWith("/_next/")) { assets.add(h); continue; }
    if (h.startsWith("/out/") || /\.(svg|png|ico|xml|txt)$/.test(h)) continue;
    if (!pages.has(h) && !queue.includes(h)) queue.push(h);
  }
}

const rel = (from, to) => {
  const depth = from.split("/").filter(Boolean).length;
  const up = depth ? "../".repeat(depth) : "";
  const [target, hash = ""] = to.split("#");
  const t = target.replace(/^\//, "");
  const file = t === "" || t.endsWith("/") ? `${t}index.html` : t;
  return `${up}${file}${hash ? `#${hash}` : ""}`;
};

const searchScript = `<script>(function(){var d=document.getElementById('search-index');if(!d)return;var items=JSON.parse(d.textContent),inp=document.getElementById('q-page'),list=document.querySelector('.results'),form=inp&&inp.form;if(!inp)return;function n(s){return s.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'')}function run(){var w=n(inp.value).split(/\\s+/).filter(Boolean);list.innerHTML='';if(!w.length)return;items.filter(function(i){var t=n(i.terms);return w.every(function(x){return t.indexOf(x)>-1})}).slice(0,30).forEach(function(i){var li=document.createElement('li');li.innerHTML='<a href="'+i.rel+'"><span><strong></strong><br><span class="shop-note"></span></span><span class="shop-note"></span></a>';li.querySelector('strong').textContent=i.name;var s=li.querySelectorAll('.shop-note');s[0].textContent=i.sub;s[1].textContent=i.rank;list.appendChild(li)})}inp.addEventListener('input',run);form.addEventListener('submit',function(e){e.preventDefault();run()});inp.value=new URLSearchParams(location.search).get('q')||'';run()})();</script>`;

let count = 0;
for (const [p, html0] of pages) {
  if (!html0) continue;
  let html = html0;
  // Remove Next.js runtime and RSC payload scripts; keep JSON-LD and the search index.
  html = html.replace(/<script(?![^>]*(?:type="application\/(?:ld\+json|json)"|data-keep))[^>]*>[\s\S]*?<\/script>/g, "");
  html = html.replace(/<link[^>]+rel="(?:preload|modulepreload)"[^>]*as="script"[^>]*\/?>/g, "");
  html = html.replace(/<link[^>]+as="script"[^>]*\/?>/g, "");
  // Search index: give each result a relative link for this page.
  html = html.replace(/(<script type="application\/json" id="search-index">)([\s\S]*?)(<\/script>)/, (_, a, json, c) => {
    const items = JSON.parse(json.replace(/\\u003c/g, "<")).map((i) => ({ ...i, rel: rel(p, i.href) }));
    return a + JSON.stringify(items).replace(/</g, "\\u003c") + c + searchScript;
  });
  for (const m of [...html.matchAll(/href="(\/out\/[^"]+)"/g)]) html = html.replace(m[0], `href="${(await resolveOut(m[1])).replace(/&/g, "&amp;")}"`);
  // Static hosts may reserve names starting with "_", so assets move to /assets/.
  html = html.replace(/\/_next\/static\//g, "/assets/");
  html = html.replace(/(href|src|action)="(\/(?!\/)[^"]*)"/g, (_, attr, url) => `${attr}="${rel(p, url)}"`);
  const file = path.join(OUT, rel("/", p));
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
  count++;
}

// CSS and the fonts it references.
for (const a of [...assets].filter((a) => a.endsWith(".css"))) {
  let css = await (await fetch(BASE + a)).text();
  for (const m of css.matchAll(/url\((?:\/_next\/static\/media\/|\.\.\/media\/)([^)]+)\)/g)) {
    const buf = Buffer.from(await (await fetch(`${BASE}/_next/static/media/${m[1]}`)).arrayBuffer());
    const dest = path.join(OUT, "assets/media", m[1]);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, buf);
  }
  css = css.replace(/url\(\/_next\/static\/media\//g, "url(../media/");
  const dest = path.join(OUT, a.replace("/_next/static/", "/assets/"));
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, css);
}
fs.copyFileSync("public/icon.svg", path.join(OUT, "icon.svg"));
// My Jerseys runs on plain JavaScript, so its script and player lists ship with the preview.
fs.copyFileSync("public/my-jerseys.js", path.join(OUT, "my-jerseys.js"));
fs.cpSync("public/player-index", path.join(OUT, "player-index"), { recursive: true });
fs.cpSync("public/vendor", path.join(OUT, "vendor"), { recursive: true });
console.log(`Exported ${count} pages to ${OUT}/ (${outCache.size} shopping links resolved)`);

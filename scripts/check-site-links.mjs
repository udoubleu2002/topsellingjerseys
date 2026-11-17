/**
 * Dead-link check for the whole site. Crawls every page reachable from the home page on a running server, then checks:
 *   1. every internal page and file returns 200,
 *   2. every /out/ (shop) and /go/ (house ad) link redirects somewhere,
 *   3. every outside link (sources, retailer pages, images) still answers, unless --internal is passed.
 * Outside sites that refuse robots (401/403/429/999) are listed as "blocked", not broken, since a person can still open them.
 * Exits 1 when something is broken.
 *
 *   npm run build && npm start &   then   BASE=http://localhost:3000 node scripts/check-site-links.mjs [--internal]
 */
const BASE = process.env.BASE || "http://localhost:3000";
const internalOnly = process.argv.includes("--internal");
const UA = "Mozilla/5.0 (compatible; TopSellingJerseysLinkCheck/1.0)";
const SITE_HOSTS = new Set(["topsellingjerseys.net", "www.topsellingjerseys.net"]);

const pool = async (items, n, fn) => {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k]); } }));
  return out;
};

const seen = new Set(["/"]);
const refs = new Map(); // link -> first page that used it
const external = new Map();
const redirects = new Set();
let queue = ["/"];
const broken = [];
let pages = 0;

const note = (map, key, from) => { if (!map.has(key)) map.set(key, from); };

while (queue.length) {
  const batch = queue.splice(0, 40);
  await pool(batch, 12, async (p) => {
    let res;
    try { res = await fetch(BASE + p, { redirect: "manual", signal: AbortSignal.timeout(30_000) }); }
    catch (e) { broken.push(`internal ${p} (${e.name}) <- ${refs.get(p) ?? "start"}`); return; }
    if (res.status !== 200) { broken.push(`internal ${res.status} ${p} <- ${refs.get(p) ?? "start"}`); return; }
    pages++;
    if (!(res.headers.get("content-type") || "").includes("html")) return;
    const html = await res.text();
    for (const m of html.matchAll(/(?:href|src)="([^"#]+)/g)) {
      const raw = m[1].replace(/&amp;/g, "&");
      if (/^(mailto|tel|sms|data|javascript):/.test(raw) || raw.startsWith("//")) continue;
      if (/^https?:/.test(raw)) {
        const u = new URL(raw);
        if (SITE_HOSTS.has(u.host)) { const local = u.pathname + u.search; note(refs, local, p); if (!seen.has(local)) { seen.add(local); queue.push(local); } }
        else if (!/^(localhost|127\.)/.test(u.host)) note(external, raw, p);
        continue;
      }
      const local = new URL(raw, BASE + p).pathname + new URL(raw, BASE + p).search;
      if (local.startsWith("/_next/")) continue;
      note(refs, local, p);
      if (/^\/(out|go)\//.test(local)) { redirects.add(local.split("?")[0]); continue; }
      if (local.startsWith("/api/")) continue;
      if (!seen.has(local)) { seen.add(local); queue.push(local); }
    }
  });
}
console.log(`${pages} pages and files crawled`);

const bad = await pool([...redirects], 12, async (p) => {
  try {
    const r = await fetch(BASE + p, { redirect: "manual", signal: AbortSignal.timeout(30_000) });
    return r.status >= 300 && r.status < 400 && r.headers.get("location") ? null : `redirect ${r.status} ${p} <- ${refs.get(p)}`;
  } catch (e) { return `redirect ${p} (${e.name}) <- ${refs.get(p)}`; }
});
broken.push(...bad.filter(Boolean));
console.log(`${redirects.size} shop and ad links checked`);

const blocked = [];
if (!internalOnly) {
  const urls = [...external.keys()];
  const results = await pool(urls, 8, async (u) => {
    for (const method of ["HEAD", "GET"]) {
      try {
        const r = await fetch(u, { method, redirect: "follow", headers: { "User-Agent": UA }, signal: AbortSignal.timeout(20_000) });
        if (r.status < 400) return null;
        if ([401, 403, 405, 429, 999].includes(r.status) && method === "GET") return { blocked: `${r.status} ${u} <- ${external.get(u)}` };
        if (method === "GET") return { broken: `external ${r.status} ${u} <- ${external.get(u)}` };
      } catch (e) {
        if (method === "GET") return { broken: `external unreachable (${e.cause?.code ?? e.name}) ${u} <- ${external.get(u)}` };
      }
    }
    return null;
  });
  for (const r of results) { if (r?.broken) broken.push(r.broken); if (r?.blocked) blocked.push(r.blocked); }
  console.log(`${urls.length} outside links checked, ${blocked.length} refused automated checks`);
  for (const b of blocked) console.log(`blocked  ${b}`);
}

for (const b of broken) console.log(`BROKEN   ${b}`);
console.log(broken.length ? `${broken.length} broken link(s).` : "No broken links.");
process.exit(broken.length ? 1 : 0);

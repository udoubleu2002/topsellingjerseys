#!/usr/bin/env node
/**
 * SEO snapshot and regression check.
 *
 *   node scripts/seo-snapshot.mjs crawl http://localhost:3000 out.json   # crawl sitemap + every internal link
 *   node scripts/seo-snapshot.mjs diff before.json after.json            # report SEO changes, exit 1 on regressions
 *
 * For every page it records status, title, meta description, canonical, robots meta, H1, H2s, JSON-LD types and
 * internal links, so a change can be checked against the baseline before it ships. No dependencies.
 */
import fs from "node:fs";

const [, , cmd, a, b] = process.argv;

const decode = (s) => s
  .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/&nbsp;/g, " ").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n));
const text = (html) => decode(html.replace(/<!--.*?-->/gs, "").replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
const attr = (tag, name) => { const m = tag.match(new RegExp(`\\s${name}="([^"]*)"`, "i")); return m ? decode(m[1]) : null; };
const metaContent = (html, key, val) => {
  for (const m of html.matchAll(/<meta\b[^>]*>/gi)) if (attr(m[0], key)?.toLowerCase() === val) return attr(m[0], "content");
  return null;
};

function parse(html, base) {
  const head = html.split(/<\/head>/i)[0];
  const title = text(head.match(/<title[^>]*>(.*?)<\/title>/is)?.[1] ?? "");
  let canonical = null;
  for (const m of head.matchAll(/<link\b[^>]*>/gi)) if (attr(m[0], "rel") === "canonical") canonical = attr(m[0], "href");
  const h1 = [...html.matchAll(/<h1\b[^>]*>(.*?)<\/h1>/gis)].map((m) => text(m[1]));
  const h2 = [...html.matchAll(/<h2\b[^>]*>(.*?)<\/h2>/gis)].map((m) => text(m[1]));
  const jsonld = [];
  for (const m of html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gis)) {
    try {
      const walk = (o) => { if (Array.isArray(o)) o.forEach(walk); else if (o && typeof o === "object") { if (o["@type"]) jsonld.push([].concat(o["@type"]).join("/")); if (o["@graph"]) walk(o["@graph"]); } };
      walk(JSON.parse(m[1]));
    } catch { jsonld.push("INVALID"); }
  }
  const links = new Set();
  for (const m of html.matchAll(/<a\b[^>]*href="([^"#]*)(#[^"]*)?"[^>]*>/gi)) {
    try {
      const u = new URL(decode(m[1]) || base, base);
      if (u.origin === new URL(base).origin) links.add(u.pathname + u.search);
    } catch {}
  }
  return {
    title,
    description: metaContent(head, "name", "description"),
    canonical,
    robots: metaContent(head, "name", "robots"),
    ogTitle: metaContent(head, "property", "og:title"),
    h1, h2,
    jsonld: [...new Set(jsonld)].sort(),
    internalLinks: [...links].sort(),
  };
}

async function crawl(origin, out) {
  origin = origin.replace(/\/$/, "");
  const sm = await (await fetch(`${origin}/sitemap.xml`)).text();
  const sitemap = [...sm.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  const robots = await (await fetch(`${origin}/robots.txt`)).text();
  const queue = ["/", ...sitemap];
  const seen = new Set(queue);
  const pages = {};
  const skip = (p) => /^\/(out|go|api|j)\//.test(p) || /\.(png|jpe?g|svg|xml|txt|js|css|json|ico)$/.test(p) || p.includes("opengraph-image");
  while (queue.length) {
    const batch = queue.splice(0, 12);
    await Promise.all(batch.map(async (p) => {
      const res = await fetch(origin + p, { redirect: "manual" });
      const rec = { status: res.status, inSitemap: sitemap.includes(p) };
      if (res.status >= 300 && res.status < 400) rec.location = res.headers.get("location");
      const xr = res.headers.get("x-robots-tag");
      if (xr) rec.xRobots = xr;
      if (res.ok && (res.headers.get("content-type") ?? "").includes("html")) {
        Object.assign(rec, parse(await res.text(), origin + p));
        for (const l of rec.internalLinks) if (!seen.has(l) && !skip(l)) { seen.add(l); queue.push(l); }
      }
      pages[p] = rec;
    }));
  }
  const sorted = Object.fromEntries(Object.entries(pages).sort(([x], [y]) => x.localeCompare(y)));
  fs.writeFileSync(out, JSON.stringify({ crawledAt: new Date().toISOString(), origin, sitemap: sitemap.sort(), robots, pages: sorted }, null, 1));
  console.log(`${Object.keys(pages).length} URLs crawled, ${sitemap.length} in sitemap -> ${out}`);
}

function diff(beforeFile, afterFile) {
  const A = JSON.parse(fs.readFileSync(beforeFile, "utf8"));
  const B = JSON.parse(fs.readFileSync(afterFile, "utf8"));
  const regressions = [], changes = [];
  for (const [p, r] of Object.entries(A.pages)) {
    const n = B.pages[p];
    if (!n) { (r.status === 200 ? regressions : changes).push(`${p}: not reached in the new crawl (was ${r.status})`); continue; }
    if (r.status !== n.status) regressions.push(`${p}: status ${r.status} -> ${n.status}`);
    for (const k of ["title", "description", "canonical", "robots", "xRobots"]) {
      if ((r[k] ?? null) !== (n[k] ?? null)) (k === "description" ? changes : regressions).push(`${p}: ${k} "${r[k]}" -> "${n[k]}"`);
    }
    if (JSON.stringify(r.h1) !== JSON.stringify(n.h1)) regressions.push(`${p}: H1 ${JSON.stringify(r.h1)} -> ${JSON.stringify(n.h1)}`);
    const lostH2 = (r.h2 ?? []).filter((h) => !(n.h2 ?? []).includes(h));
    const newH2 = (n.h2 ?? []).filter((h) => !(r.h2 ?? []).includes(h));
    if (lostH2.length) changes.push(`${p}: H2 removed ${JSON.stringify(lostH2)}`);
    if (newH2.length) changes.push(`${p}: H2 added ${JSON.stringify(newH2)}`);
    const lostLD = (r.jsonld ?? []).filter((t) => !(n.jsonld ?? []).includes(t));
    if (lostLD.length) regressions.push(`${p}: structured data removed ${lostLD.join(", ")}`);
    const lostLinks = (r.internalLinks ?? []).filter((l) => !(n.internalLinks ?? []).includes(l));
    if (lostLinks.length) changes.push(`${p}: ${lostLinks.length} internal link(s) removed: ${lostLinks.slice(0, 5).join(", ")}${lostLinks.length > 5 ? " ..." : ""}`);
  }
  const added = Object.keys(B.pages).filter((p) => !A.pages[p]);
  if (added.length) changes.push(`New URLs: ${added.join(", ")}`);
  const lostSm = A.sitemap.filter((u) => !B.sitemap.includes(u));
  const newSm = B.sitemap.filter((u) => !A.sitemap.includes(u));
  if (lostSm.length) regressions.push(`Removed from sitemap: ${lostSm.join(", ")}`);
  if (newSm.length) changes.push(`Added to sitemap: ${newSm.join(", ")}`);
  if (A.robots !== B.robots) regressions.push("robots.txt changed");
  console.log(`REGRESSIONS (${regressions.length})`); regressions.forEach((x) => console.log("  " + x));
  console.log(`OTHER CHANGES (${changes.length})`); changes.forEach((x) => console.log("  " + x));
  process.exit(regressions.length ? 1 : 0);
}

if (cmd === "crawl" && a && b) await crawl(a, b);
else if (cmd === "diff" && a && b) diff(a, b);
else { console.error("usage: seo-snapshot.mjs crawl <origin> <out.json> | diff <before.json> <after.json>"); process.exit(2); }

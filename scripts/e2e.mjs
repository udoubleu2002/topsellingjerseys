/**
 * End-to-end checks against a running server (default http://localhost:3000).
 * Crawls every internal page and checks titles, meta descriptions, canonicals, one H1, broken links,
 * outbound /out/ redirects, sponsored rel attributes, and horizontal overflow at phone, tablet and desktop widths.
 * Run: npm run build && npm start, then BASE=http://localhost:3000 npm run test:e2e
 * Uses Playwright from the local or global install.
 */
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
const require = createRequire(import.meta.url);
let pw;
try { pw = require("playwright"); } catch { pw = require(`${execSync("npm root -g").toString().trim()}/playwright`); }

const BASE = process.env.BASE || "http://localhost:3000";
const fails = [];
const fail = (m) => { fails.push(m); console.error("FAIL", m); };

const browser = await pw.chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();

// Search landing pages are not linked from the main site, so the sitemap seeds them.
const sitemapXml = await (await fetch(`${BASE}/sitemap.xml`)).text();
const queue = ["/", ...[...sitemapXml.matchAll(/<loc>[^<]*?(\/jerseys\/[^<]*)<\/loc>/g)].map((m) => m[1])], seen = new Set(), titles = new Map(), descs = new Map();
let outLinks = 0;
while (queue.length) {
  const path = queue.shift();
  if (seen.has(path)) continue;
  seen.add(path);
  const res = await page.goto(BASE + path, { waitUntil: "domcontentloaded" });
  if (!res || res.status() !== 200) { fail(`${path}: status ${res?.status()}`); continue; }
  const info = await page.evaluate(() => ({
    title: document.title,
    desc: document.querySelector('meta[name="description"]')?.getAttribute("content") || "",
    canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href") || "",
    robots: document.querySelector('meta[name="robots"]')?.getAttribute("content") || "",
    h1: [...document.querySelectorAll("h1")].map((h) => h.textContent.trim()),
    links: [...document.querySelectorAll("a[href]")].map((a) => ({ href: a.getAttribute("href"), rel: a.getAttribute("rel") || "" })),
    ld: [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => { try { JSON.parse(s.textContent); return true; } catch { return false; } }),
  }));
  if (info.h1.length !== 1) fail(`${path}: ${info.h1.length} H1 elements`);
  if (!info.title) fail(`${path}: missing title`);
  if (!info.desc) fail(`${path}: missing meta description`);
  const indexable = !info.robots.includes("noindex");
  if (indexable && !info.canonical) fail(`${path}: missing canonical`);
  if (info.canonical && !info.canonical.endsWith(path)) fail(`${path}: canonical points elsewhere (${info.canonical})`);
  if (info.ld.includes(false)) fail(`${path}: invalid JSON-LD`);
  if (indexable) {
    if (titles.has(info.title)) fail(`${path}: duplicate title with ${titles.get(info.title)}`);
    if (descs.has(info.desc)) fail(`${path}: duplicate description with ${descs.get(info.desc)}`);
    titles.set(info.title, path); descs.set(info.desc, path);
  }
  if (path.startsWith("/top-selling-") && !/^Top Selling (NFL|NBA|WNBA|MLB|NHL|MLS) Jerseys$/.test(info.h1[0])) fail(`${path}: H1 is "${info.h1[0]}"`);
  for (const l of info.links) {
    if (!l.href.startsWith("/")) continue;
    const clean = l.href.split("#")[0].split("?")[0];
    if (clean.startsWith("/out/")) {
      outLinks++;
      if (!/sponsored/.test(l.rel)) fail(`${path}: outbound ${clean} missing rel=sponsored`);
      continue;
    }
    if (clean && !seen.has(clean) && !queue.includes(clean)) queue.push(clean);
  }
}
console.log(`Crawled ${seen.size} pages, ${outLinks} shopping links`);

// Every distinct /out/ target must redirect to a retailer.
const outs = new Set();
for (const p of [...seen].filter((p) => p.startsWith("/players/") || p.startsWith("/top-selling-"))) {
  await page.goto(BASE + p, { waitUntil: "domcontentloaded" });
  for (const h of await page.$$eval('a[href^="/out/"]', (as) => as.map((a) => a.getAttribute("href")))) outs.add(h);
}
for (const o of outs) {
  const r = await fetch(BASE + o, { redirect: "manual" });
  if (r.status !== 302 || !/^https:\/\//.test(r.headers.get("location") || "")) fail(`${o}: expected 302 to https, got ${r.status}`);
  if (!/noindex/.test(r.headers.get("x-robots-tag") || "")) fail(`${o}: missing X-Robots-Tag`);
}
console.log(`Checked ${outs.size} outbound redirects`);
if ((await fetch(BASE + "/players/not-a-player/")).status !== 404) fail("unknown player should 404");
if ((await fetch(BASE + "/out/not-an-offer/", { redirect: "manual" })).status !== 404) fail("unknown offer should 404");

// Responsive: no horizontal overflow on key templates.
const sample = ["/", "/top-selling-nfl-jerseys/", "/top-selling-mls-jerseys/", "/top-selling-wnba-jerseys/", "/players/caitlin-clark/", "/players/josh-allen/", "/players/lionel-messi/", "/rankings/", "/rankings/nfl/nfl-2026-06-09-nflpa-year-end/", "/methodology/", "/search/?q=lakers"];
for (const w of [390, 768, 1280]) {
  await page.setViewportSize({ width: w, height: 900 });
  for (const p of sample) {
    await page.goto(BASE + p, { waitUntil: "networkidle" });
    const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (over > 1) fail(`${p} @${w}px: horizontal overflow ${over}px`);
  }
}
// Search journey.
await page.goto(BASE + "/search/?q=ohtani", { waitUntil: "networkidle" });
if (!(await page.textContent(".results"))?.includes("Shohei Ohtani")) fail("search for ohtani did not find Shohei Ohtani");
// Mobile menu journey.
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(BASE + "/", { waitUntil: "networkidle" });
await page.click(".mobile-menu summary");
await page.click('.mobile-panel a[href="/top-selling-nba-jerseys/"]');
await page.waitForURL("**/top-selling-nba-jerseys/");

await browser.close();
if (fails.length) { console.error(`\n${fails.length} failure(s)`); process.exit(1); }
console.log("All end-to-end checks passed");

/**
 * After a production deploy, requests every jersey photo the built pages use through the Netlify Image CDN, so the
 * first visitor gets a cached, resized image instead of waiting while a 1-2 MB Lids original is fetched and resized.
 * The Lids feed changes photos daily, so without this the first view of many pages after each deploy is slow.
 * It never fails the build: errors are logged and skipped, and it stops after a time budget.
 */
const fs = require("node:fs");
const path = require("node:path");

const BUDGET_MS = 9 * 60 * 1000;
const CONCURRENCY = 16;
const TIMEOUT_MS = 30000;

function htmlFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) htmlFiles(p, out);
    else if (e.name.endsWith(".html")) out.push(p);
  }
  return out;
}

const onSuccess = async ({ constants, utils }) => {
  const site = process.env.URL;
  if (process.env.CONTEXT !== "production" || !site) return console.log("warm-images: not a production deploy; skipped");
  // Pre-rendered pages: .next/server/app, plus wherever the Next.js runtime copied them for serving.
  const roots = [path.join(constants.PUBLISH_DIR, "server", "app"), path.join(process.cwd(), ".netlify")];
  // Busiest pages first, so the time budget goes to the photos most visitors see.
  const rank = (f) => (/[\\/]app[\\/]index\.html$/.test(f) ? 0 : /top-selling-[a-z]+-jerseys/.test(f) ? 1 : /[\\/](shop|trending)[\\/.]/.test(f) ? 2 : /[\\/]players[\\/]/.test(f) ? 3 : 4);
  const files = roots.flatMap((r) => htmlFiles(r)).sort((a, b) => rank(a) - rank(b));
  const urls = new Set();
  for (const f of files) {
    for (const m of fs.readFileSync(f, "utf8").matchAll(/\/\.netlify\/images\?url=[^"'\s,]+/g)) urls.add(m[0].replace(/&amp;/g, "&"));
  }
  const list = [...urls];
  const start = Date.now();
  let ok = 0, failed = 0, i = 0;
  async function worker() {
    while (i < list.length && Date.now() - start < BUDGET_MS) {
      const u = list[i++];
      try {
        const r = await fetch(site + u, { headers: { accept: "image/avif,image/webp,*/*" }, signal: AbortSignal.timeout(TIMEOUT_MS) });
        await r.arrayBuffer();
        r.ok ? ok++ : failed++;
      } catch { failed++; }
    }
  }
  try {
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  } catch (e) {
    console.log(`warm-images: ${e.message}`);
  }
  const msg = `warmed ${ok} of ${list.length} jersey images in ${Math.round((Date.now() - start) / 1000)}s (${failed} failed${i < list.length ? `, ${list.length - i} left when time ran out` : ""})`;
  console.log(`warm-images: ${msg}`);
  utils.status.show({ title: "Jersey image warm-up", summary: msg });
};

module.exports = { onSuccess };

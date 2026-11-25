// Builds data/search-demand.json from a Search Console "Pages" export (Performance > Pages > Export > CSV).
// Usage: node scripts/build-search-demand.mjs path/to/Pages.csv [minImpressions=1]
// Player pages listed here have already earned Google impressions, so they stay indexable (see src/lib/indexing.ts).
// Entries are merged with the existing file, so a page keeps its place after a quiet month.
import fs from "node:fs";

const [csvPath, minArg] = process.argv.slice(2);
if (!csvPath) { console.error("Usage: node scripts/build-search-demand.mjs Pages.csv [minImpressions]"); process.exit(1); }
const min = Number(minArg ?? 1);
const out = new URL("../data/search-demand.json", import.meta.url);
const prev = fs.existsSync(out) ? JSON.parse(fs.readFileSync(out, "utf8")) : { players: [] };
const bySlug = new Map(prev.players.map((p) => [p.slug, p]));
const today = new Date().toISOString().slice(0, 10);

for (const line of fs.readFileSync(csvPath, "utf8").split(/\r?\n/).slice(1)) {
  const [url, , impressions] = line.split(",");
  const m = url?.match(/\/players\/([a-z0-9-]+)\/$/);
  const n = Number(impressions);
  if (!m || !(n >= min)) continue;
  const old = bySlug.get(m[1]);
  bySlug.set(m[1], { slug: m[1], impressions: Math.max(n, old?.impressions ?? 0), seen: today > (old?.seen ?? "") ? today : old.seen });
}
const players = [...bySlug.values()].sort((a, b) => b.impressions - a.impressions || a.slug.localeCompare(b.slug));
fs.writeFileSync(out, JSON.stringify({
  note: "Player pages that have earned Google search impressions (from Search Console Pages exports). Kept indexable even without a sales-list rank. Built by scripts/build-search-demand.mjs.",
  updated: today,
  players,
}, null, 2) + "\n");
console.log(`${players.length} player pages with search demand`);

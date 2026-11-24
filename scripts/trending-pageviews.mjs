/**
 * Weekly "trending" lists: the top 15 players in each league (the site shows the top 5 who have a Lids jersey) by English Wikipedia page views over the last 7 full days,
 * with the 7 days before for comparison. Uses Wikimedia's public Pageviews API and the MediaWiki search API.
 *   node scripts/trending-pageviews.mjs            writes data/trending.json and data/wikipedia-titles.json
 *   node scripts/trending-pageviews.mjs --dry-run  prints the lists only
 * Page views measure interest in a player, not jersey sales; the site labels them that way.
 */
import fs from "node:fs";
import path from "node:path";

const DATA = path.join(process.cwd(), "data");
const dry = process.argv.includes("--dry-run");
const UA = "TopSellingJerseysTrending/1.0 (https://topsellingjerseys.net; weekly trending lists)";
const read = (f) => JSON.parse(fs.readFileSync(path.join(DATA, f), "utf8"));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(url) {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": UA, "Api-User-Agent": UA }, signal: AbortSignal.timeout(20_000) });
      if (r.status === 404) return null;
      if (r.status === 429 || r.status >= 500) { await sleep(2000 * (attempt + 1)); continue; }
      if (!r.ok) throw new Error(`${r.status} ${url}`);
      return await r.json();
    } catch (e) {
      if (attempt === 3) throw e;
      await sleep(2000 * (attempt + 1));
    }
  }
  return null;
}

const pool = async (items, n, fn) => {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k]); await sleep(50); } }));
  return out;
};

const plain = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]/gi, "").toLowerCase().trim();
const SPORT_WORDS = { nfl: /american football|football player|quarterback|linebacker|receiver|running back|cornerback|safety|tight end|defensive|offensive|kicker|punter/i, nba: /basketball/i, wnba: /basketball/i, mlb: /baseball|pitcher|outfielder|infielder|catcher/i, nhl: /hockey/i, mls: /soccer|footballer|association football/i };
const SPORT = { nfl: "American football", nba: "basketball", wnba: "basketball", mlb: "baseball", nhl: "ice hockey", mls: "soccer" };

const players = read("players.json").filter((p) => p.status !== "Retired" && p.teamId);
const teams = new Map(read("teams.json").map((t) => [t.id, t]));
const titlesFile = path.join(DATA, "wikipedia-titles.json");
const titles = fs.existsSync(titlesFile) ? JSON.parse(fs.readFileSync(titlesFile, "utf8")) : {};

// 1. Wikipedia article for each player: a Wikipedia source URL if we have one, else a search for the name plus team
//    and sport, accepting only a result whose title is the player's name (optionally with a parenthetical).
async function resolveTitle(p) {
  if (titles[p.id]) return titles[p.id];
  const own = (t) => plain(t.replace(/_/g, " ").replace(/\s*\(.*\)$/, "")) === plain(p.name);
  const src = p.sources.map((u) => /^https:\/\/en\.wikipedia\.org\/wiki\/([^#?]+)/.exec(u)?.[1]).filter(Boolean).map((t) => decodeURIComponent(t)).find(own);
  if (src) return (titles[p.id] = src.replace(/ /g, "_"));
  const team = teams.get(p.teamId);
  const q = `${p.name} ${team?.name ?? ""} ${SPORT[p.leagues[0]] ?? ""}`;
  const d = await getJson(`https://en.wikipedia.org/w/api.php?action=query&list=search&srlimit=5&format=json&srsearch=${encodeURIComponent(q)}`);
  // Only exact-name results, then confirm with the article's short description that it is a player in this sport
  // and not a disambiguation page or someone else with the same name.
  for (const hit of (d?.query?.search ?? []).filter((s) => own(s.title))) {
    const info = await getJson(`https://en.wikipedia.org/w/api.php?action=query&prop=pageprops|description&redirects=1&format=json&titles=${encodeURIComponent(hit.title)}`);
    const page = Object.values(info?.query?.pages ?? {})[0];
    if (!page || page.pageprops?.disambiguation !== undefined) continue;
    if (!SPORT_WORDS[p.leagues[0]].test(page.description ?? "")) continue;
    return (titles[p.id] = page.title.replace(/ /g, "_"));
  }
  return null;
}

// 2. Daily views for the last 14 full days (UTC), split into this week and the week before.
const day = (d) => d.toISOString().slice(0, 10).replace(/-/g, "");
const end = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate() - 1));
const start = new Date(end.getTime() - 13 * 86400_000);
const weekStart = new Date(end.getTime() - 6 * 86400_000);
async function views(title) {
  const d = await getJson(`https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/user/${encodeURIComponent(title)}/daily/${day(start)}/${day(end)}`);
  const items = d?.items ?? [];
  const cut = day(weekStart) + "00";
  return { week: items.filter((x) => x.timestamp >= cut).reduce((s, x) => s + x.views, 0), prev: items.filter((x) => x.timestamp < cut).reduce((s, x) => s + x.views, 0) };
}

// A lookup that still fails after retries skips that player; too many failures stops the run so a bad network day
// never publishes lopsided lists.
let failed = 0;
const rows = (await pool(players, 6, async (p) => {
  try {
    const title = await resolveTitle(p);
    if (!title) return null;
    return { playerId: p.id, league: p.leagues[0], title, ...(await views(title)) };
  } catch (e) {
    failed++;
    console.warn(`skipped ${p.id}: ${e.cause?.code ?? e.message}`);
    return null;
  }
})).filter(Boolean);
if (failed > players.length * 0.05) { console.error(`${failed} lookups failed; not writing new lists.`); process.exit(1); }

const missing = players.length - rows.length;
const leagues = {};
for (const lg of ["nfl", "nba", "wnba", "mlb", "nhl", "mls"]) {
  leagues[lg] = rows.filter((r) => r.league === lg && r.week > 0).sort((a, b) => b.week - a.week).slice(0, 15)
    .map(({ playerId, title, week, prev }) => ({ playerId, wikipediaTitle: title, views: week, previousViews: prev }));
}
const out = {
  note: "Weekly trending lists: English Wikipedia page views (people, not bots) per player over the last 7 full days, top 15 per league (the site shows the top 5 with a Lids jersey). Interest in the player, not jersey sales. Built by scripts/trending-pageviews.mjs.",
  source: "https://wikimedia.org/api/rest_v1/",
  start: weekStart.toISOString().slice(0, 10),
  end: end.toISOString().slice(0, 10),
  updated: new Date().toISOString().slice(0, 10),
  playersChecked: rows.length,
  leagues,
};
for (const [lg, list] of Object.entries(leagues)) console.log(lg.toUpperCase(), list.map((r) => `${r.playerId} ${r.views} (prev ${r.previousViews})`).join(" | "));
console.log(`${rows.length} players matched to Wikipedia, ${missing} without a match, window ${out.start} to ${out.end}`);
if (!dry) {
  fs.writeFileSync(path.join(DATA, "trending.json"), JSON.stringify(out, null, 2) + "\n");
  fs.writeFileSync(titlesFile, JSON.stringify(Object.fromEntries(Object.entries(titles).sort()), null, 2) + "\n");
}

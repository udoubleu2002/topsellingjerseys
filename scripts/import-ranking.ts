/**
 * Imports a newly published ranking as a DRAFT snapshot. A reviewer publishes it by setting "status": "published".
 *
 *   npm run import:ranking -- data/imports/<file>.json
 *
 * Input file (JSON):
 * {
 *   "id": "nfl-2026-10-15-nflpa-midseason", "league": "nfl", "series": "nflpa-midseason",
 *   "title": "...", "publisher": "...", "sourceUrl": "https://...", "publishedDate": "YYYY-MM-DD",
 *   "periodStart": "YYYY-MM-DD", "periodEnd": "YYYY-MM-DD", "periodLabel": "...", "scope": "...", "methodology": null,
 *   "limitations": [],
 *   "entries": [ { "rank": 1, "player": "Josh Allen", "team": "Buffalo Bills" }, ... ]
 * }
 * "player" may be a player id or exact name. Unknown players are reported, never invented: add them to players.json
 * (with three sourced highlights) first, then re-run.
 */
import fs from "node:fs";
import path from "node:path";
import { loadStore } from "../src/lib/data";
import { checkRanking } from "../src/lib/validate";
import { RankingSchema } from "../src/lib/schema";

const file = process.argv[2];
if (!file) { console.error("Usage: npm run import:ranking -- <file.json>"); process.exit(1); }
const input = JSON.parse(fs.readFileSync(file, "utf8"));
const store = loadStore();
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
const problems: string[] = [];

const entries = (input.entries as { rank: number; player: string; team?: string }[]).map((e) => {
  const p = store.players.find((x) => x.id === e.player || norm(x.name) === norm(e.player));
  if (!p) problems.push(`rank ${e.rank}: no player record for "${e.player}"`);
  const t = e.team ? store.teams.find((x) => norm(x.name) === norm(e.team!) || x.id === e.team) : undefined;
  if (e.team && !t) problems.push(`rank ${e.rank}: unknown team "${e.team}"`);
  return { rank: e.rank, playerId: p?.id ?? `UNKNOWN:${e.player}`, teamIdAtReport: t?.id ?? null };
});

const today = new Date().toISOString().slice(0, 10);
const draft = { ...input, entries, retrievedDate: input.retrievedDate ?? today, lastVerified: today, limitations: input.limitations ?? [], status: "draft" };
delete (draft as Record<string, unknown>).player;

const parsed = RankingSchema.safeParse(draft);
if (!parsed.success) problems.push(...parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`));
else problems.push(...checkRanking(parsed.data, new Set(store.players.map((p) => p.id))).filter((e) => !e.includes("UNKNOWN:")));
if (store.rankings.some((r) => r.id === input.id)) problems.push(`a ranking with id ${input.id} already exists`);

if (problems.length) {
  console.error("Not imported:\n" + problems.map((p) => `  - ${p}`).join("\n"));
  process.exit(1);
}
const out = path.join("data", "rankings", input.league, `${input.id}.json`);
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(parsed.data, null, 2) + "\n");
console.log(`Draft saved to ${out} (${entries.length} entries). Review it against the source, then set "status": "published".`);

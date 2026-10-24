/**
 * Typed data-access layer. All content lives in /data as JSON, validated with zod at build time.
 * Rankings, players, statistics and products are separate stores, so updating one never overwrites another.
 */
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import {
  LeagueSchema, TeamSchema, PlayerSchema, StatLineSchema, RankingSchema, MerchantSchema, ProductSchema, PromotionSchema,
  type League, type Team, type Player, type StatLine, type Ranking, type Merchant, type Product, type Promotion,
} from "./schema";
import { getProfile } from "./profiles";

const DATA_DIR = path.join(process.cwd(), "data");

function readJson<T>(file: string, schema: z.ZodType<T>): T {
  const raw = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), "utf8"));
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Invalid data in data/${file}:\n${parsed.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n")}`);
  }
  return parsed.data;
}

let cache: Store | null = null;

export interface Store {
  leagues: League[];
  teams: Team[];
  players: Player[];
  stats: StatLine[];
  rankings: Ranking[];
  merchants: Merchant[];
  products: Product[];
  promotions: Promotion[];
  directory: Record<string, { id: string; name: string }[]>;
}

export function loadStore(): Store {
  if (cache) return cache;
  const rankings: Ranking[] = [];
  const rdir = path.join(DATA_DIR, "rankings");
  for (const league of fs.readdirSync(rdir)) {
    for (const f of fs.readdirSync(path.join(rdir, league)).filter((f) => f.endsWith(".json"))) {
      rankings.push(readJson(`rankings/${league}/${f}`, RankingSchema));
    }
  }
  cache = {
    leagues: readJson("leagues.json", z.array(LeagueSchema)),
    teams: readJson("teams.json", z.array(TeamSchema)),
    players: readJson("players.json", z.array(PlayerSchema)),
    stats: readJson("stats.json", z.array(StatLineSchema)),
    rankings,
    merchants: readJson("merchants.json", z.array(MerchantSchema)),
    products: readJson("products.json", z.array(ProductSchema)),
    promotions: fs.existsSync(path.join(DATA_DIR, "promotions.json")) ? readJson("promotions.json", z.array(PromotionSchema)) : [],
    directory: readJson("team-directory.json", z.object({ leagues: z.record(z.array(z.object({ id: z.string(), name: z.string() }))) })).leagues,
  };
  return cache;
}

export const getLeagues = () => loadStore().leagues;
export const getLeague = (id: string) => getLeagues().find((l) => l.id === id);
export const getLeagueBySlug = (slug: string) => getLeagues().find((l) => l.slug === slug);
export const getTeam = (id: string | null | undefined) => (id ? loadStore().teams.find((t) => t.id === id) : undefined);

/** Every team in a league (data/team-directory.json), with full team data where the site has it. */
export function getTeamDirectory(leagueId: string): { id: string; name: string; league: string; team?: Team }[] {
  return (loadStore().directory[leagueId] ?? []).map((d) => ({ ...d, league: leagueId, team: getTeam(d.id) }));
}

/** A team from teams.json, or a name-only team from the directory (enough for a retailer team search). */
export function getAnyTeam(id: string): Pick<Team, "id" | "name" | "league"> | undefined {
  const t = getTeam(id);
  if (t) return t;
  for (const [league, list] of Object.entries(loadStore().directory)) {
    const d = list.find((x) => x.id === id);
    if (d) return { ...d, league };
  }
  return undefined;
}
export const getPlayers = () => loadStore().players;
export const getPlayer = (id: string) => getPlayers().find((p) => p.id === id);
export const getPlayerBySlug = (slug: string) => getPlayers().find((p) => p.slug === slug);
export const getMerchant = (id: string) => loadStore().merchants.find((m) => m.id === id);

/** Published reports for a league, newest publication first. */
export function getRankings(leagueId?: string): Ranking[] {
  return loadStore()
    .rankings.filter((r) => r.status !== "draft" && (!leagueId || r.league === leagueId))
    .sort((a, b) => b.publishedDate.localeCompare(a.publishedDate));
}

/** The current ranking is the newest published report for the league. */
export function getCurrentRanking(leagueId: string): Ranking | undefined {
  return getRankings(leagueId).find((r) => r.status === "published");
}

export const getRanking = (id: string) => loadStore().rankings.find((r) => r.id === id && r.status !== "draft");

/** Previous report in the same series, used for rank movement. Reports from other series are never compared. */
export function getPreviousInSeries(r: Ranking): Ranking | undefined {
  return getRankings(r.league).find((x) => x.series === r.series && x.publishedDate < r.publishedDate);
}

export function rankMovement(r: Ranking, playerId: string): { previousRank: number | null; delta: number | null } | null {
  const prev = getPreviousInSeries(r);
  if (!prev) return null;
  const now = r.entries.find((e) => e.playerId === playerId);
  const before = prev.entries.find((e) => e.playerId === playerId);
  if (!now) return null;
  if (!before) return { previousRank: null, delta: null };
  return { previousRank: before.rank, delta: before.rank - now.rank };
}

/** Every ranking appearance for a player, newest first. */
export function getAppearances(playerId: string) {
  return getRankings()
    .flatMap((r) => r.entries.filter((e) => e.playerId === playerId).map((e) => ({ ranking: r, rank: e.rank })))
    .sort((a, b) => b.ranking.publishedDate.localeCompare(a.ranking.publishedDate));
}

/** Latest regular-season stat line for the player, unless it is demo data. */
export function getStatLine(playerId: string): StatLine | undefined {
  return loadStore()
    .stats.filter((s) => s.playerId === playerId && !s.isDemo)
    .sort((a, b) => (b.throughDate ?? "").localeCompare(a.throughDate ?? ""))[0];
}

export const getProducts = (playerId: string) =>
  loadStore().products.filter((p) => p.playerId === playerId && !p.flagged);

/** A player page is indexable when it has verified highlights and either a ranking appearance or an original write-up. */
export function isIndexable(p: Player) {
  return p.highlights.length === 3 && (getAppearances(p.id).length > 0 || !!getProfile(p.id));
}

export function teamPlayers(teamId: string) {
  return getPlayers().filter((p) => (p.teamId ?? p.lastTeamId) === teamId);
}

/** Team line for a player: current team, or status plus last team for retired players and free agents. */
export function teamLabel(p: Player): string {
  const team = getTeam(p.teamId ?? p.lastTeamId);
  if (p.teamId) return team?.name ?? "";
  return team ? `${p.status} (last team: ${team.name})` : p.status;
}

/** Latest stat through-date among a ranking's players, or null when players' dates differ. */
export function commonStatsThrough(r: Ranking): string | null {
  const dates = new Set(r.entries.map((e) => getStatLine(e.playerId)?.throughDate ?? null));
  return dates.size === 1 ? [...dates][0] : null;
}

/** Promotions running on the given date (defaults to the build's review date), optionally for one league. */
export function getActivePromotions(leagueId?: string, on = new Date().toISOString().slice(0, 10)) {
  return loadStore().promotions.filter((p) => p.startDate <= on && p.endDate >= on && (!leagueId || p.leagues.length === 0 || p.leagues.includes(leagueId)));
}

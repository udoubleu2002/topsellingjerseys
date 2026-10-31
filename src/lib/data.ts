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
import { site } from "./config";
import { daysBetween } from "./format";

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

/** The newest published report for the league (the list its league page shows). It is the latest report, not necessarily current sales. */
export function getCurrentRanking(leagueId: string): Ranking | undefined {
  return getRankings(leagueId).find((r) => r.status === "published");
}

/** Sales periods that ended more than this many days before the content review date are labeled as dated. */
export const STALE_AFTER_DAYS = 120;

export type ReportStatus = {
  kind: "latest" | "superseded" | "historical";
  /** "Latest Published Report", "Superseded Report" or "Historical Report". */
  label: string;
  /** The newer report that replaces this one in the same series (superseded) or the league's latest report (historical). */
  newer?: Ranking;
  /** For the latest report: its sales period ended long ago and no newer report has been published. */
  dated: boolean;
  periodEnd: string;
};

/**
 * One status system for every report. A report is never called "current": the newest one is the latest published
 * report, an older one in the same series is superseded by its successor, and an older one from another series is historical.
 */
export function reportStatus(r: Ranking, today = site.lastReviewed): ReportStatus {
  const latest = getCurrentRanking(r.league);
  const periodEnd = r.periodEnd ?? r.publishedDate;
  if (latest?.id === r.id) {
    return { kind: "latest", label: "Latest Published Report", dated: daysBetween(periodEnd, today) >= STALE_AFTER_DAYS, periodEnd };
  }
  const successor = getRankings(r.league)
    .filter((x) => x.series === r.series && x.publishedDate > r.publishedDate)
    .sort((a, b) => a.publishedDate.localeCompare(b.publishedDate))[0];
  if (successor) return { kind: "superseded", label: "Superseded Report", newer: successor, dated: false, periodEnd };
  return { kind: "historical", label: "Historical Report", newer: latest, dated: false, periodEnd };
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
    .flatMap((r) => r.entries.filter((e) => e.playerId === playerId).map((e) => ({ ranking: r, rank: e.rank, reportTeam: getTeam(e.teamIdAtReport), entry: e })))
    .sort((a, b) => b.ranking.publishedDate.localeCompare(a.ranking.publishedDate));
}

/**
 * The player's place on a league's latest published report, or undefined. Titles, intros and "No. X" labels use only this,
 * so a rank from a superseded report is never presented as the player's current ranking.
 */
export function getLatestAppearance(playerId: string) {
  return getAppearances(playerId).find((a) => getCurrentRanking(a.ranking.league)?.id === a.ranking.id);
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

/**
 * Teams for one ranking entry. The report's team is what the sales were credited to and is never rewritten; the current
 * line is set only when the player has since moved, retired or become a free agent, so lists can say "now with ...".
 */
export function entryTeams(entry: Ranking["entries"][number], p: Player): { reportTeam: Team | undefined; number: string | null; now: string | null } {
  const reportTeam = getTeam(entry.teamIdAtReport) ?? getTeam(p.teamId ?? p.lastTeamId);
  const moved = !!entry.teamIdAtReport && entry.teamIdAtReport !== p.teamId;
  const number = entry.numberAtReport !== undefined ? entry.numberAtReport : p.number;
  let now: string | null = null;
  if (moved) {
    if (p.teamId) now = `Now with ${getTeam(p.teamId)?.name ?? "a new team"}`;
    else now = p.status === "Retired" ? "Now retired" : p.status === "Free agent" ? "Now a free agent" : `Now ${p.status.toLowerCase()}`;
  }
  return { reportTeam, number, now };
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

export type MovementRow = { playerId: string; rank: number; previousRank: number | null; delta: number | null; teamIdAtReport: string | null };

/**
 * Report-to-report changes within one series (same publisher, method and period length). Returns null when there is no
 * earlier report in the series, so different periods or methods are never compared. Only ranks actually listed on the site
 * are compared: when a report is shown in part, "left the list" means "not in the ranks shown".
 */
export function getMovement(r: Ranking) {
  const prev = getPreviousInSeries(r);
  if (!prev) return null;
  const earlier = getRankings(r.league).filter((x) => x.series === r.series && x.publishedDate < prev.publishedDate);
  const rows: MovementRow[] = r.entries.map((e) => {
    const before = prev.entries.find((x) => x.playerId === e.playerId);
    return { playerId: e.playerId, rank: e.rank, previousRank: before?.rank ?? null, delta: before ? before.rank - e.rank : null, teamIdAtReport: e.teamIdAtReport };
  });
  const isNew = rows.filter((x) => x.previousRank === null);
  const returning = isNew.filter((x) => earlier.some((er) => er.entries.some((e) => e.playerId === x.playerId)));
  const depth = r.entries.length;
  const left = prev.entries
    .filter((e) => e.rank <= depth && !r.entries.some((x) => x.playerId === e.playerId))
    .map((e) => ({ playerId: e.playerId, previousRank: e.rank, teamIdAtReport: e.teamIdAtReport }));
  // Team counts compare the same number of ranks in both reports.
  const same = Math.min(depth, prev.entries.length);
  const count = (list: Ranking["entries"]) => {
    const m = new Map<string, number>();
    for (const e of list.filter((x) => x.rank <= same)) if (e.teamIdAtReport) m.set(e.teamIdAtReport, (m.get(e.teamIdAtReport) ?? 0) + 1);
    return m;
  };
  const nowTeams = count(r.entries), prevTeams = count(prev.entries);
  const teams = [...new Set([...nowTeams.keys(), ...prevTeams.keys()])]
    .map((teamId) => ({ teamId, now: nowTeams.get(teamId) ?? 0, before: prevTeams.get(teamId) ?? 0 }))
    .filter((t) => t.now >= 2 || t.before >= 2)
    .sort((a, b) => b.now - a.now || b.before - a.before);
  return {
    previous: prev,
    depth,
    previousDepth: prev.entries.length,
    risers: rows.filter((x) => (x.delta ?? 0) > 0).sort((a, b) => b.delta! - a.delta! || a.rank - b.rank),
    fallers: rows.filter((x) => (x.delta ?? 0) < 0).sort((a, b) => a.delta! - b.delta! || a.rank - b.rank),
    held: rows.filter((x) => x.delta === 0),
    newEntries: isNew.filter((x) => !returning.includes(x)),
    returning,
    stayed: rows.filter((x) => x.previousRank !== null),
    left,
    teams,
    teamDepth: same,
  };
}

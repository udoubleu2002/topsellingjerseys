/**
 * "Trending": movement between two comparable published reports (same publisher, same method, same series).
 * Nothing here is estimated. A league with no comparable earlier report is listed as having no comparison.
 */
import fs from "node:fs";
import path from "node:path";
import { TrendingSchema, type League, type Player, type Ranking, type Trending } from "./schema";
import { getCurrentRanking, getLeagues, getMovement, getPlayer, getPreviousInSeries } from "./data";

export type LeagueTrend = { league: League; ranking: Ranking; movement: NonNullable<ReturnType<typeof getMovement>> };

export function getTrends(): { compared: LeagueTrend[]; uncompared: { league: League; ranking: Ranking }[] } {
  const compared: LeagueTrend[] = [];
  const uncompared: { league: League; ranking: Ranking }[] = [];
  for (const league of getLeagues()) {
    const ranking = getCurrentRanking(league.id);
    if (!ranking) continue;
    const movement = getMovement(ranking);
    if (movement) compared.push({ league, ranking, movement });
    else uncompared.push({ league, ranking });
  }
  return { compared, uncompared };
}

export type TrendRow = { league: League; ranking: Ranking; previous: Ranking; playerId: string; rank: number; previousRank: number | null; delta: number | null };

/** The biggest rank gains across every league that has a comparison, largest first. */
export function topRisers(n = 6): TrendRow[] {
  return getTrends().compared
    .flatMap(({ league, ranking, movement }) => movement.risers.map((r) => ({ league, ranking, previous: movement.previous, ...r })))
    .sort((a, b) => b.delta! - a.delta! || a.rank - b.rank)
    .slice(0, n);
}

/** Players new to a list (not in the previous report's ranks), best rank first. */
export function newEntries(n = 6): TrendRow[] {
  return getTrends().compared
    .flatMap(({ league, ranking, movement }) => movement.newEntries.map((r) => ({ league, ranking, previous: movement.previous, ...r })))
    .sort((a, b) => a.rank - b.rank)
    .slice(0, n);
}

/** Leagues where the same player was No. 1 on both the latest and the previous comparable report. */
export function repeatLeaders(): { league: League; ranking: Ranking; previous: Ranking; playerId: string }[] {
  return getTrends().compared
    .filter(({ ranking }) => {
      const prev = getPreviousInSeries(ranking);
      return prev && prev.entries[0]?.playerId === ranking.entries[0]?.playerId;
    })
    .map(({ league, ranking, movement }) => ({ league, ranking, previous: movement.previous, playerId: ranking.entries[0].playerId }));
}

/**
 * Weekly "trending" top 5 per league from English Wikipedia page views over the last 7 full days (data/trending.json).
 * This is interest in the player, not sales; pages say so. Returns null until the weekly job has written the file.
 */
let pv: { data: Trending; leagues: { league: League; rows: PageviewRow[] }[] } | null | undefined;
export type PageviewRow = { player: Player; views: number; previousViews: number; change: number | null; rank: number };
export function pageviewTrending() {
  if (pv !== undefined) return pv;
  const file = path.join(process.cwd(), "data", "trending.json");
  if (!fs.existsSync(file)) return (pv = null);
  const data = TrendingSchema.parse(JSON.parse(fs.readFileSync(file, "utf8")));
  const leagues = getLeagues()
    .map((league) => ({
      league,
      rows: (data.leagues[league.id] ?? [])
        .map((r, i) => ({ player: getPlayer(r.playerId)!, views: r.views, previousViews: r.previousViews, change: r.previousViews ? Math.round(((r.views - r.previousViews) / r.previousViews) * 100) : null, rank: i + 1 }))
        .filter((r) => r.player),
    }))
    .filter((x) => x.rows.length);
  return (pv = leagues.length ? { data, leagues } : null);
}

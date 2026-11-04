/**
 * "Trending": movement between two comparable published reports (same publisher, same method, same series).
 * Nothing here is estimated. A league with no comparable earlier report is listed as having no comparison.
 */
import type { League, Ranking } from "./schema";
import { getCurrentRanking, getLeagues, getMovement, getPreviousInSeries } from "./data";

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

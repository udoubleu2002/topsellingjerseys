import { getLeagues, getCurrentRanking, getPlayer, entryTeams } from "./data";
import { fmtDate, period } from "./format";

/** Each league's current published list with its top players resolved, for the "best selling" guide pages. */
export function bestSellingByLeague(top = 5) {
  return getLeagues().flatMap((league) => {
    const ranking = getCurrentRanking(league.id);
    if (!ranking) return [];
    const entries = ranking.entries.slice(0, top).map((e) => {
      const player = getPlayer(e.playerId)!;
      // Team and number as credited in the report; `now` notes a later move.
      const { reportTeam, number, now } = entryTeams(e, player);
      return { rank: e.rank, player, team: reportTeam, number, now };
    });
    return [{
      league, ranking, entries, total: ranking.entries.length,
      published: fmtDate(ranking.publishedDate),
      period: period(ranking.periodStart, ranking.periodEnd, ranking.periodLabel),
    }];
  });
}

export const leagueList = (names: string[]) => (names.length < 2 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`);

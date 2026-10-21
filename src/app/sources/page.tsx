import Link from "next/link";
import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { InfoPage } from "@/components/InfoPage";
import { getLeagues, getRankings, loadStore } from "@/lib/data";
import { fmtShortDate } from "@/lib/format";

export const metadata: Metadata = pageMeta({ title: "Jersey Sales Sources and Data Coverage", description: "Every jersey sales report behind Top Selling Jerseys, with publishers and dates, plus how current the player stats are for each league.", path: "/sources/" });

export default function Sources() {
  const { stats, players } = loadStore();
  return (
    <InfoPage title="Sources and Data Coverage" path="/sources/" lede="The reports behind each ranking and how current the player data is.">
      <h2>Ranking sources</h2>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>League</th><th>Report</th><th>Published</th><th>Listed</th></tr></thead>
          <tbody>
            {getRankings().map((r) => (
              <tr key={r.id}>
                <td>{r.league.toUpperCase()}</td>
                <td><a href={r.sourceUrl} target="_blank" rel="noopener">{r.title}</a><br /><span className="shop-note">{r.publisher}</span></td>
                <td>{fmtShortDate(r.publishedDate)}</td>
                <td>{r.entries.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2>Player statistics coverage</h2>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>League</th><th>Players</th><th>With stats</th><th>Latest through-date</th></tr></thead>
          <tbody>
            {getLeagues().map((l) => {
              const ps = players.filter((p) => p.leagues[0] === l.id);
              const withStats = ps.filter((p) => stats.some((s) => s.playerId === p.id && s.statistics.length && !s.isDemo));
              const latest = stats.filter((s) => s.league === l.id).map((s) => s.throughDate ?? "").sort().pop();
              return (
                <tr key={l.id}><td>{l.name}</td><td>{ps.length}</td><td>{withStats.length}</td><td>{fmtShortDate(latest)}</td></tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p>Statistics are collected from league sites, team sites and established stats publishers, and each player page links its stat source. They are updated by hand, not by a live feed, so they can trail the latest game. See the <Link href="/methodology/">methodology</Link>.</p>
    </InfoPage>
  );
}
